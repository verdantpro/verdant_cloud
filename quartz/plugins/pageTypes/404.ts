import { QuartzPageTypePlugin } from "../types"
import { match } from "./matchers"
import { NotFound } from "../../components"
import { defaultProcessedContent } from "../vfile"
import { i18n } from "../../i18n"
import { FullSlug } from "../../util/path"

export const NotFoundPageType: QuartzPageTypePlugin = () => ({
  name: "404",
  priority: -1,
  match: match.none(),
  generate({ cfg }) {
    const notFound = i18n(cfg.locale).pages.error.title
    const slug = "404" as FullSlug
    const [, vfile] = defaultProcessedContent({
      slug,
      text: notFound,
      description: notFound,
      frontmatter: { title: notFound, tags: [] },
    })

    // keep the virtual 404 out of every listing — recent-notes, the sitemap, the
    // RSS feed. it is a page, not a note. recent-notes filters on data.unlisted;
    // set it directly here rather than via frontmatter, because this page is
    // generated at emit time and skips the transformer that would otherwise copy
    // frontmatter.unlisted across. (previously hidden with a css :has() rule,
    // which left the dead link in the markup for crawlers and readers.)
    ;(vfile.data as Record<string, unknown>).unlisted = true

    return [
      {
        slug,
        title: notFound,
        data: vfile.data,
      },
    ]
  },
  layout: "404",
  frame: "minimal",
  body: NotFound,
})
