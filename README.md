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

| path                        | what                                       |
| --------------------------- | ------------------------------------------ |
| `content/`                  | the notes; everything else is machinery    |
| `quartz.config.yaml`        | theme, plugins, layout                     |
| `quartz/styles/custom.scss` | all custom styling                         |
| `quartz/static/`            | portrait plates, favicon                   |
| `plugins/footer/`           | vendored footer (see below)                |
| `scripts/`                  | portrait dithering                         |

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
dots and ruins it.** Regenerate rather than resize:

```bash
python3 scripts/dither-portrait.py path/to/photo.jpg   # needs pillow
```

## Local modifications to Quartz

Two changes live outside `custom.scss` and will conflict when pulling upstream:

**`quartz/components/scripts/popover.inline.ts`** — bail out of empty popovers.
Content types with no renderer (e.g. `application/xml`, i.e. the RSS link)
produced a blank floating box on hover. Tracked in git.

**`plugins/footer/`** — a vendored footer, pointed at from the config by local
path (`source: ./plugins/footer`). The upstream `@quartz-community/footer`
hardcodes a "Created with Quartz" credit with no option to disable it.

> This started as a patch to the fetched plugin in `.quartz/` — which is
> **gitignored**, so CI would have refetched the plugin and silently emitted
> different HTML than a local build. That is exactly the build-drift you would
> flag in a security review, so the component is vendored instead: tracked, no
> fetch, local and CI byte-identical. Quartz is credited on `/colophon`, and
> `LICENSE.txt` is retained, which is what MIT actually requires.

## Utility classes

`.index-list` — a link list with dates flush right, hairline-separated. Wrap a
markdown list in `<div class="index-list">` and suffix each item with `*2026*`.
Currently unused; kept for a "start here" section on the homepage.

## Git

- `origin` — [verdantpro/verdant_cloud](https://github.com/verdantpro/verdant_cloud), branch `main`.
- `upstream` — jackyzha0/quartz, for pulling Quartz updates.

The full Quartz history was kept (~1878 commits), so `git merge upstream/v5`
stays straightforward. It also means the contributor graph is mostly Jacky's,
and that `quartz/components/scripts/popover.inline.ts` will need merge care.

## Not done yet

- **No deploy.** Nothing publishes yet. The target is GCS + load balancer + CDN
  (per the [cloud resume challenge](https://cloudresumechallenge.dev/docs/the-challenge/googlecloud/)) —
  **not** GitHub/Cloudflare Pages. Standing up the abstraction is the point of
  the exercise. On that route DNS is an A record to the load balancer IP, so
  `public/CNAME` (a GitHub Pages artifact) becomes dead weight.
- **No `/resume`** — the one page the challenge actually requires.
- `analytics: plausible` is set in the config but **emits no script** — it is
  collecting nothing. Note `/colophon` claims no third-party scripts run, which
  is currently true. Keep it true, or change the claim.
- The **404 page** is Quartz's default and does not match the theme.
- **OG images** render with Quartz's default palette, so link previews on
  Slack/Twitter won't look like the site. Worth fixing before sharing links.
- `content/colophon.md` has no `hosting` row — add one once a platform is picked.
