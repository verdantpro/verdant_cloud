// Sidenotes: render markdown footnotes as Tufte-style margin notes, at build
// time, with zero client JavaScript.
//
// Footnotes here are stock remark-gfm. The mdast->hast conversion emits an
// inline reference (<sup><a data-footnote-ref href="#user-content-fn-N">) and a
// single <section data-footnotes> block appended to the end of the article. A
// bottom-of-page footnote list is the opposite of what this site wants: the
// aesthetic direction is Tufte, where a note belongs in the margin beside the
// text it annotates, and the right gutter is otherwise dead space.
//
// This rehype (HAST) transformer runs after that conversion. For each reference
// it relocates the matching footnote body into an <aside class="sidenote">
// placed immediately after the top-level block that contains the reference, then
// removes the original <section>. CSS (custom.scss) floats the aside into the
// ~8rem gutter between the 34rem reading measure and the 42rem column edge on
// desktop, and renders it as an indented inline note below desktop. Nothing runs
// in the browser — so the colophon's "what javascript runs" list is untouched,
// which is the whole reason this is a build-time transform and not a script.
//
// The single source of truth stays single: the footnote body is MOVED, not
// copied, so there is no duplicated note text in the DOM (no double
// screen-reader reads). The inline <sup> stays in the prose as the anchor, and
// the id "user-content-fn-N" is moved from the removed <li> onto the <aside>, so
// the reference link still resolves (it now jumps to the margin note).

import { visit, SKIP } from "unist-util-visit"
import { h } from "hastscript"

const isElement = (node, tag) =>
  node && node.type === "element" && (tag === undefined || node.tagName === tag)

const hasProp = (node, prop) => Boolean(node && node.properties && prop in node.properties)

// hast camelCases data-* attributes: data-footnotes -> dataFootnotes, etc.
const isFootnotesSection = (node) => isElement(node, "section") && hasProp(node, "dataFootnotes")
const isFootnoteRef = (node) => isElement(node, "a") && hasProp(node, "dataFootnoteRef")
const isBackref = (node) => isElement(node, "a") && hasProp(node, "dataFootnoteBackref")

// the visible marker text of a node (the reference anchor renders the number)
const textOf = (node) => {
  let text = ""
  visit(node, "text", (t) => {
    text += t.value
  })
  return text.trim()
}

// The rehype attacher. Runs on the article content root; its top-level children
// are the block elements (p, headings, lists, and the footnotes <section>).
function relocateFootnotes() {
  return (tree) => {
    const children = tree.children ?? []

    const sectionIndex = children.findIndex(isFootnotesSection)
    if (sectionIndex === -1) return // no footnotes on this page — nothing to do

    // 1. Collect footnote bodies by id, stripping the trailing "back to
    //    reference" anchor (pointless once the note sits beside its reference).
    const bodies = new Map()
    visit(children[sectionIndex], "element", (node) => {
      if (!(isElement(node, "li") && hasProp(node, "id"))) return
      const holder = { type: "root", children: node.children }
      visit(holder, "element", (n, index, parent) => {
        if (isBackref(n)) {
          parent.children.splice(index, 1)
          return [SKIP, index]
        }
        return undefined
      })
      bodies.set(String(node.properties.id), holder.children)
    })

    // 2. Rebuild the top-level children: drop the <section>, and after each block
    //    that references a footnote, splice in an <aside> per (first) reference.
    const used = new Set()
    const out = []
    children.forEach((block, index) => {
      if (index === sectionIndex) return // remove the original footnote section
      out.push(block)

      // capture each reference's target id AND its visible marker. gfm numbers
      // footnotes sequentially (1, 2, …) in the <sup>, but keys the id off the
      // label ([^css] -> user-content-fn-css), so the number must come from the
      // anchor text, not the id — otherwise the margin note and its inline mark
      // would disagree.
      const refs = []
      visit(block, "element", (node) => {
        if (isFootnoteRef(node) && hasProp(node, "href")) {
          const href = String(node.properties.href)
          if (href.startsWith("#")) refs.push({ id: href.slice(1), marker: textOf(node) })
        }
      })

      for (const { id, marker } of refs) {
        // A footnote referenced twice yields two refs sharing one id; emit the
        // aside once (at the first reference) so ids stay unique.
        if (used.has(id)) continue
        const body = bodies.get(id)
        if (!body) continue
        used.add(id)
        const num = marker || id.replace(/^user-content-fn-/, "")
        out.push(h("aside", { class: "sidenote", id, "data-sidenote": num }, body))
      }
    })

    tree.children = out
  }
}

export const Sidenotes = () => ({
  name: "Sidenotes",
  htmlPlugins() {
    return [relocateFootnotes]
  },
})

export default Sidenotes
