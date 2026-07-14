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

  async function count() {
    const el = document.querySelector(".visitor-count")
    if (!el || busy || el.dataset.done === "true") return
    el.dataset.done = "true"
    busy = true

    const counted = seen()
    if (!counted) markSeen() // synchronous, before the fetch: see note above

    try {
      const res = counted
        ? await fetch(STATS, { method: "GET" })
        : await fetch(VISIT, { method: "POST" })
      if (!res.ok) throw new Error(res.status)
      render(el, await res.json())
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

  const FooterComponent = ({ displayClass }) =>
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
    )

  if (showCount) {
    FooterComponent.afterDOMLoaded = counterScript(statsPath, visitPath)
  }

  return FooterComponent
}

export default Footer
