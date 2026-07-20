// A footer that renders only the links given in quartz.config.yaml, plus the
// visitor counter (step 7 of the cloud resume challenge).
//
// This exists so the build has no untracked patches in it. The upstream
// @quartz-community/footer hardcodes a "Created with Quartz" credit with no
// option to disable it, so we previously edited the fetched plugin in .quartz/
// — which is gitignored, meaning CI would refetch the plugin and silently
// produce different HTML than a local build. Vendoring the component keeps
// local and CI byte-identical.
//
// Quartz is credited on /colophon instead, and LICENSE.txt is retained.
//
// The counter lives HERE rather than in its own plugin because quartz's `footer`
// layout slot holds exactly one component (cfg.ts: `footer: QuartzComponent`,
// singular — not an array). A second component declaring defaultPosition
// "footer" is dropped silently: no warning, no markup. We already own this
// component, so the counter is a few lines inside it rather than a plugin that
// cannot be mounted.
//
// Two things the counter refuses to do:
//
//   1. Call a third party. The paths are same-origin (/api/*), served by a
//      CloudFront behavior that forwards to API Gateway. /colophon claims "every
//      request goes to this domain" — an execute-api.amazonaws.com fetch would
//      make that false, and that claim is the point of the site.
//
//   2. Block or disfigure the page. If the API is unreachable the element
//      removes itself rather than showing a zero or an error. A dead counter is
//      worse than no counter.
//
// Plain JS on purpose: no build step, nothing to get stale.

import { h } from "preact"
import { execSync } from "node:child_process"

// Build stamp shown on /colophon: the running commit and build date, in the
// technical-manual voice. Computed once here at module load — NOT per page — so
// the git call runs a single time per build no matter how many pages render. It
// is a systems-person tell that the site is a live, rebuilt system, and a fact a
// reader can check against the repo.
//
// `git describe --always --dirty` returns the short commit (there are no tags to
// describe against) and appends "-dirty" when the working tree has uncommitted
// changes, so the stamp never claims a clean commit it was not built from. Falls
// back to a CI-provided commit env var, then to the date alone, so a build with
// no git available renders an honest stamp rather than throwing.
function computeBuildStamp() {
  // Prefer CI-provided SHA so a clean Actions checkout never stamps "-dirty"
  // from a local uncommitted tree. Fall back to git describe for laptop builds.
  let commit = (process.env.GIT_COMMIT ?? process.env.COMMIT_REF ?? "").trim()
  if (commit) {
    commit = commit.slice(0, 7)
  } else {
    try {
      commit = execSync("git describe --always --dirty --abbrev=7", {
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim()
    } catch {
      commit = ""
    }
  }
  const date = new Date().toISOString().slice(0, 10) // UTC, YYYY-MM-DD
  return commit ? `build ${commit} · ${date}` : `build ${date}`
}

const BUILD_STAMP = computeBuildStamp()

// One POST per browser session, not per pageview. quartz runs as an SPA, so a
// naive POST on every `nav` event would count each internal link click as a new
// visitor, and so would a refresh. Later loads in the same session read with GET.
//
// The session flag is written BEFORE the request, not after it. quartz can fire
// `nav` twice on a single load and re-render the footer in between, so the two
// invocations see different elements — an element-level guard does not stop
// them. Writing the flag after `await fetch(...)` leaves both of them reading an
// unset flag and both POSTing: measured, one page load counted as two visitors.
// Marking synchronously closes that race. The cost of the trade is that a failed
// POST does not retry within the session, which is the right way to be wrong: a
// counter that undercounts on an error beats one that inflates on every visit.
//
// If POST fails (throttle, 403 origin check, 5xx), fall back to GET /api/stats so
// the visitor still sees the number. A missing counter is worse than an uncounted
// view — same fail-soft rule as when the API is unreachable entirely.
const counterScript = (statsPath, visitPath) => `
(function () {
  const STATS = ${JSON.stringify(statsPath)}
  const VISIT = ${JSON.stringify(visitPath)}
  const SEEN = "verdant:counted"
  let busy = false

  function seen() {
    try {
      return sessionStorage.getItem(SEEN) === "1"
    } catch (e) {
      // storage blocked (private mode): read only, never risk a double count
      return true
    }
  }

  function markSeen() {
    try {
      sessionStorage.setItem(SEEN, "1")
    } catch (e) {}
  }

  function render(el, data) {
    const total = Number(data.totalVisitors)
    if (!Number.isFinite(total)) throw new Error("bad payload")
    const today = Number(data.today)
    const parts = ["views · " + total.toLocaleString()]
    if (Number.isFinite(today) && today > 0) parts.push("today · " + today.toLocaleString())
    el.textContent = parts.join("  ·  ")
    el.removeAttribute("hidden")
  }

  async function fetchStats() {
    const res = await fetch(STATS, { method: "GET" })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  }

  async function count() {
    const el = document.querySelector(".visitor-count")
    if (!el || busy || el.dataset.done === "true") return
    el.dataset.done = "true"
    busy = true

    const counted = seen()
    if (!counted) markSeen() // synchronous, before the fetch: see note above

    try {
      if (counted) {
        render(el, await fetchStats())
        return
      }
      const res = await fetch(VISIT, { method: "POST" })
      if (res.ok) {
        render(el, await res.json())
        return
      }
      // throttled / rejected / error: still show the number without counting
      render(el, await fetchStats())
    } catch (e) {
      // fail soft: no counter beats a broken one
      el.remove()
    } finally {
      busy = false
    }
  }

  document.addEventListener("nav", count)
})()
`

export const Footer = (opts) => {
  const links = opts?.links ?? {}
  const statsPath = opts?.statsPath ?? "/api/stats"
  const visitPath = opts?.visitPath ?? "/api/visit"
  const showCount = opts?.visitorCount !== false

  const FooterComponent = ({ displayClass, fileData }) =>
    h(
      "footer",
      { class: displayClass ?? "" },
      h(
        "ul",
        null,
        Object.entries(links).map(([text, href]) => h("li", null, h("a", { href }, text))),
      ),
      // `hidden` until the fetch resolves, so a failed call leaves no empty row
      showCount ? h("p", { class: "visitor-count", hidden: true }) : null,
      // colophon-only: site-wide truth belongs where a systems reader looks for
      // it, not under every note. data-slug on <body> also drives the CSS.
      fileData?.slug === "colophon" ? h("p", { class: "build-stamp" }, BUILD_STAMP) : null,
    )

  if (showCount) {
    FooterComponent.afterDOMLoaded = counterScript(statsPath, visitPath)
  }

  return FooterComponent
}

export default Footer
