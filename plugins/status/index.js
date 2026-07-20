// Renders a note's `status:` frontmatter as a dot + label under the title.
//
// The site's own premise is that notes are "unfinished on purpose — revised in
// place rather than published and abandoned". That claim is only legible if a
// reader can see which notes are which, so status is surfaced rather than
// implied. No status in the frontmatter renders nothing at all: a note that
// hasn't declared one shouldn't be labelled by default.
//
// note-properties is the only stock plugin that prints a frontmatter value, and
// it prints an undifferentiated table row — there is no per-property hook to
// style `status` differently from `description`. Hence a component.
//
// Also forces note-properties <details> open on every nav. The stock plugin
// persists collapse in localStorage ("note-properties-collapsed"); we restyle
// that panel as a permanent description subtitle in custom.scss, so a closed
// state makes the subtitle flash then vanish. CSS forces the body visible as a
// backstop; this script keeps the open attribute honest too.
//
// Plain JS on purpose, like plugins/footer: no build step, nothing to get stale.

import { h } from "preact"

// Keep description subtitles visible: stock note-properties is a collapsible
// <details> that re-applies localStorage collapse on every SPA nav/render.
const keepDescriptionOpen = `
(() => {
  // stock plugin key — see .quartz/plugins/note-properties client script
  const KEY = "note-properties-collapsed"
  function openAll() {
    // clear first so a later stock handler on the same tick sees null and leaves open
    try { localStorage.removeItem(KEY) } catch (_) {}
    document.querySelectorAll("details.note-properties").forEach((el) => {
      el.open = true
    })
  }
  function onNav() {
    openAll()
    // stock note-properties also listens on nav/render; microtask re-asserts after it
    queueMicrotask(openAll)
  }
  document.addEventListener("nav", onNav)
  document.addEventListener("render", onNav)
  openAll()
})()
`

export const Status = () => {
  const StatusComponent = ({ fileData, displayClass }) => {
    const raw = fileData?.frontmatter?.status

    if (typeof raw !== "string") return null
    const status = raw.trim().toLowerCase()
    if (status === "") return null

    return h(
      "p",
      {
        class: ["note-status", displayClass].filter(Boolean).join(" "),
        // the dot's colour is keyed off this in custom.scss; an unrecognised
        // status still renders, just in the default grey
        "data-status": status,
      },
      status,
    )
  }

  // Always attach: this script serves every page that has note-properties, not
  // only pages with a status: field. Status is in the global beforeBody layout.
  StatusComponent.afterDOMLoaded = keepDescriptionOpen

  return StatusComponent
}

export default Status
