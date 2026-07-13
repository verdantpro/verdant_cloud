# verdant

My digital garden, published at [verdantprotocol.com](https://verdantprotocol.com).

Built on [Quartz 5](https://quartz.jzhao.xyz): notes live in `content/` as plain
markdown and are rendered to static HTML at build time. No database, no runtime.

## Running it

```bash
npx quartz build --serve    # http://localhost:8080, rebuilds on save
npx quartz build            # write static output to public/
```

## Where things are

| path                        | what                                    |
| --------------------------- | --------------------------------------- |
| `content/`                  | the notes; everything else is machinery |
| `quartz.config.yaml`        | theme, plugins, layout                  |
| `quartz/styles/custom.scss` | all custom styling                      |
| `quartz/static/`            | portrait plates, favicon                |

## The design

Minimal and technical. System monospace throughout, a near-black/off-white base
with one green accent, hairline rules, square corners.

**No webfonts are fetched.** `fontOrigin: local` plus the disabled `fonts`
plugin means zero external requests. The font names in `quartz.config.yaml`
(`IBM Plex Mono`) exist only to feed the og-image renderer, which needs a real
fetchable font to lay out social cards — they are not what the site displays.
The actual stack is pinned in `custom.scss`.

> **Gotcha:** anything in Quartz that reaches for `var(--bodyFont)` will render
> in a **sans fallback**, because that variable resolves to a font we never load.
> This has already bitten the headings and the link popovers. If text shows up in
> sans, that's why — add the selector to the mono list at the top of `custom.scss`.

**Code blocks are terminal-monochrome.** Every token inherits body text colour;
only comments recede to grey and strings take the accent. Shiki still emits its
GitHub theme as inline `--shiki-*` variables, so `custom.scss` wins by
out-specifying `syntax.scss` — changing `theme:` in the config will do nothing.

**The sidebar portrait is two 1-bit plates**, not one image plus a CSS filter. A
1-bit image cannot be theme-flipped with `invert()`: that inverts the *tones*
too and the portrait comes out a photographic negative. So `portrait-light.png`
inks the dark regions black, and `portrait-dark.png` inks the light regions
white. Each is 96px displayed at 192px — an exact 2× integer scale, so every
dither dot lands as a clean 2×2 block. **Any non-integer scale resamples the
dots and ruins it.** Regenerate with the script in the scratchpad, not by
resizing.

## Local modifications to Quartz

Two changes live outside `custom.scss` and will conflict when pulling upstream:

**`quartz/components/scripts/popover.inline.ts`** — bail out of empty popovers.
Content types with no renderer (e.g. `application/xml`, i.e. the RSS link)
produced a blank floating box on hover. Tracked in git.

**`.quartz/plugins/footer/`** — the hardcoded "Created with Quartz" credit is
removed, from *both* `dist/index.js` and `dist/components/index.js` (the loader
uses the latter; patching only the first does nothing).

> **`.quartz/` is gitignored, so this patch is NOT tracked.** A fresh clone or a
> CI build refetches the plugin and the credit comes back. `custom.scss` keeps a
> `footer > p { display: none }` fallback so it stays invisible if that happens.
> The site credits its tools on `/colophon` instead.

## Utility classes

`.index-list` — a link list with dates flush right, hairline-separated. Wrap a
markdown list in `<div class="index-list">` and suffix each item with `*2026*`.
Currently unused; kept for a "start here" section on the homepage.

## Git

`upstream` points at jackyzha0/quartz for pulling Quartz updates. There is **no
`origin`** — the original one pointed at Jacky's repo, where we have no write
access, so it was removed.

## Not done yet

- **No deploy.** No `origin`, no CI. Nothing publishes. `public/CNAME` already
  says verdantprotocol.com, so GitHub Pages or Cloudflare Pages is the short path.
- `analytics: plausible` is set in the config but **emits no script** — it is
  collecting nothing.
- The **404 page** is Quartz's default and does not match the theme.
- **OG images** render with Quartz's default palette, so link previews on
  Slack/Twitter won't look like the site.
- `content/colophon.md` has no `hosting` row — add one once a platform is picked.
