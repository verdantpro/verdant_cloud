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
// Plain JS on purpose, like plugins/footer: no build step, nothing to get stale.

import { h } from "preact"

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

  return StatusComponent
}

export default Status
