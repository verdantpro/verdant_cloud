// A sidebar list of every tag in the garden, with a count, linking to /tags/<tag>.
//
// Quartz has no stock component for this: `tag-list` renders only the *current
// page's* tags as chips under its title, and `explorer` is a file tree. The tag
// pages themselves are already emitted by `tag-page` — nothing linked to them,
// so they were unreachable except by clicking a chip on a note you had already
// found. This turns the left rail into navigation.
//
// Counts come from allFiles, so they follow frontmatter with no list to maintain.
//
// Plain JS on purpose, like plugins/footer: no build step, nothing to get stale.

import { h } from "preact"

export const TagIndex = (opts) => {
  const title = opts?.title ?? "tags"
  // 0 = show every tag. a garden this size has no reason to truncate, but a
  // rail is a rail and this will need a cap long before the tags run out.
  const limit = opts?.limit ?? 0

  const TagIndexComponent = ({ allFiles, displayClass }) => {
    const counts = new Map()

    for (const file of allFiles ?? []) {
      const tags = file?.frontmatter?.tags
      if (!Array.isArray(tags)) continue

      for (const tag of tags) {
        if (typeof tag !== "string") continue
        const name = tag.trim()
        if (name === "") continue
        counts.set(name, (counts.get(name) ?? 0) + 1)
      }
    }

    if (counts.size === 0) return null

    // busiest first, alphabetical within a count — so the rail leads with where
    // the garden actually is, not with whatever sorts first
    const sorted = [...counts.entries()].sort(
      ([aTag, aCount], [bTag, bCount]) => bCount - aCount || aTag.localeCompare(bTag),
    )
    const shown = limit > 0 ? sorted.slice(0, limit) : sorted

    return h(
      "div",
      { class: ["tag-index", displayClass].filter(Boolean).join(" ") },
      h("h3", null, title),
      h(
        "ul",
        null,
        shown.map(([tag, count]) =>
          h(
            "li",
            null,
            // absolute href, like the vendored footer: the site is served from
            // the domain root, and a component has no slug to resolve against
            h("a", { href: `/tags/${tag}`, class: "internal tag-index-link" }, `#${tag}`),
            h("span", { class: "tag-index-count" }, String(count)),
          ),
        ),
      ),
    )
  }

  return TagIndexComponent
}

export default TagIndex
