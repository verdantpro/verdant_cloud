// A footer that renders only the links given in quartz.config.yaml.
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
// Plain JS on purpose: no build step, nothing to get stale.

import { h } from "preact"

export const Footer = (opts) => {
  const links = opts?.links ?? {}

  const FooterComponent = ({ displayClass }) =>
    h(
      "footer",
      { class: displayClass ?? "" },
      h(
        "ul",
        null,
        Object.entries(links).map(([text, href]) => h("li", null, h("a", { href }, text))),
      ),
    )

  return FooterComponent
}

export default Footer
