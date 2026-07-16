import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot, simplifySlug } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../../.quartz/plugins"
export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    // 1-bit portrait plates as favicons — same dual-plate idea as the sidebar
    // mark, but each plate sits on an opaque site-surface tile (#f1f2ec /
    // #0e0f0e, matching theme light/dark surfaces). bare ink-on-transparent
    // vanishes in the opposite tab chrome; a bare (no media) link is the light
    // tile for browsers that ignore the query. regenerate via
    // scripts/dither-portrait.py (--icons-only or a full photo run).
    //
    // ?v= is a deliberate cache buster: browsers (and some CDNs) keep favicons
    // far longer than other assets, often past a hard reload. bump the number
    // whenever the icon files change so existing tabs pick up the new mark.
    const iconVersion = "2"
    const iconPath = `${joinSegments(baseDir, "static/icon.png")}?v=${iconVersion}`
    const iconDarkPath = `${joinSegments(baseDir, "static/icon-dark.png")}?v=${iconVersion}`

    // Canonical URL of the current page. simplifySlug collapses "index" -> "/"
    // and "notes/index" -> "notes/", so the homepage emits the apex rather than
    // "/index" (which is what the bare slug produced). Used for both og:url and
    // the <link rel="canonical"> below.
    const socialUrl =
      fileData.slug === "404"
        ? url.toString()
        : joinSegments(url.toString(), simplifySlug(fileData.slug!))

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    const coreStylesheet = css[0]?.content
    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        {/* quartz preconnects to cdnjs unconditionally, to warm up mermaid's lazy
            import. mermaid is disabled and nothing else on this site uses cdnjs, so
            the preconnect only handed every visitor's ip to cloudflare for nothing.
            re-add it if mermaid is ever turned back on. */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        {/* notes are articles; the homepage, resume, and listings are websites */}
        <meta
          property="og:type"
          content={fileData.slug?.startsWith("notes/") ? "article" : "website"}
        />
        {/* a missing URL should not be indexed, and it has no canonical of its own */}
        {fileData.slug === "404" && <meta name="robots" content="noindex" />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
            {/* the site is reachable at both apex and www; www 301s to apex, but
                a canonical tag is the in-HTML signal that names the apex URL as
                authoritative. quartz emits none by default. the 404 is skipped:
                a canonical pointing every missing URL at the homepage is wrong. */}
            {fileData.slug !== "404" && <link rel="canonical" href={socialUrl} />}
          </>
        )}

        <link rel="icon" href={iconPath} media="(prefers-color-scheme: light)" />
        <link rel="icon" href={iconDarkPath} media="(prefers-color-scheme: dark)" />
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
