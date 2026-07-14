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

**Zero third-party requests.** A full page load contacts no external host at all —
verified in a browser, not by grep. `/colophon` says so publicly, so this is a
claim a reader can check. Keeping it true means the following stay off, and any
of them can silently break it:

| off               | why                                                            |
| ----------------- | -------------------------------------------------------------- |
| `analytics`       | was `plausible`, emitting no script — collecting nothing        |
| `latex` (katex)   | fetches `copy-tex` from cdn.jsdelivr.net at runtime             |
| `mermaid`         | lazy-imports from cdnjs.cloudflare.com                          |
| cdnjs `preconnect` | patched out of `Head.tsx` — see below; **not** gated by config |

Re-enabling math or diagrams means self-hosting their assets, or softening the
colophon's wording. Don't leave the claim false.

**No webfonts are fetched.** `fontOrigin: local` plus the disabled `fonts`
plugin. The font names in `quartz.config.yaml` (`IBM Plex Mono`) exist only to
feed the og-image renderer, which needs a real fetchable font to lay out social
cards — they are not what the site displays. The actual stack is pinned in
`custom.scss`.

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

### Overriding Quartz's CSS

Three traps in `base.scss` that each look identical from the outside ("my rule
isn't applying") and have different causes. All three cost real time on the 404:

- The general column rule is `.page > #quartz-body .center` — it contains an
  **ID**, and an ID outranks any number of classes. A class-only selector loses
  silently, and can apply some properties while losing others.
- `base.scss` sets **`min-width: 100%`** on `.center` and `footer`. `min-width`
  beats `max-width`, so a width cap does nothing until you reset it to `0`.
- `#quartz-body` is a **grid**. `margin: auto` on a grid item resolves to `0`;
  centre with `justify-self`. Mind `box-sizing` too — the footer is `border-box`
  and `.center` is not, which offsets them by exactly their padding.

Measure with `getComputedStyle` rather than trusting a screenshot. And if a
change seems not to apply at all, hard-reload before re-debugging: the dev server
serves cached JS and CSS, which has twice looked like a broken fix.

## Local modifications to Quartz

These live outside `custom.scss` and will conflict when pulling upstream:

**`quartz/components/Head.tsx`** — removed an unconditional
`<link rel="preconnect" href="https://cdnjs.cloudflare.com">`. Quartz emits it on
every page to warm up mermaid's lazy import, **outside any config gate** — so
disabling mermaid does not remove it. It opened a connection to Cloudflare on
every visit, handing each visitor's IP and user-agent to a third party whether or
not a diagram existed. Re-add it if mermaid is ever turned back on.

**`quartz/components/scripts/popover.inline.ts`** — two changes, both tracked in
git. First, bail out of empty popovers: content types with no renderer (e.g.
`application/xml`, i.e. the RSS link) produced a blank floating box on hover.
Second, skip `.tag-link` entirely — a tag popover previewed a tag listing page,
covering the article to report the tag name and a count.

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

## Deploy target (AWS)

Nothing publishes yet. The target is the [cloud resume challenge, AWS
edition](https://cloudresumechallenge.dev/docs/the-challenge/aws/) — **not**
GitHub/Cloudflare Pages. Standing up the abstraction is the point of the exercise.

Originally planned on GCP; switched to AWS after the GCP account was blocked at
signup. AWS is also the better fit here: HTTPS needs no paid load balancer
(CloudFront + a free ACM cert), and the bucket can stay **completely private**.

```
public/  --[GitHub Actions, OIDC role]-->  S3 (private, Block Public Access on)
                                             |  Origin Access Control
                                             v
                                          CloudFront  + ACM cert (us-east-1 only)
                                             |        + CloudFront Function (clean URLs)
                                             v
                                          Route 53  A/AAAA alias --> distribution
```

Backend (separate repo): API Gateway HTTP API → Lambda (Python) → DynamoDB, all
in Terraform, CI via GitHub OIDC — **no stored AWS credentials anywhere**.

### Gotchas this repo already knows about

- **CI must run `npx quartz plugin install` before `quartz build`.** A clean
  checkout cannot build without it — `Head.tsx` imports a generated
  `.quartz/plugins` index that does not exist until plugins are installed, and
  `.quartz/` is gitignored. The guide's sample workflow shows
  `npm ci && npx quartz build`; that will fail here. This is also why the footer
  is vendored rather than patched (see above).
- **Clean URLs.** Quartz links to `/notes/why-cloud`, but the object is
  `notes/why-cloud.html`. CloudFront's default-root-object only applies at `/`,
  not in subpaths. Fixed with a viewer-request CloudFront Function that rewrites
  the URI. **This repo has no `fix-routing.sh`** — the build emits flat `.html`
  files, so the rewrite is `req.uri = uri + ".html"`, *not* `+ "/index.html"`.
  Adopting the folder convention instead means adding that script first. Pick one
  and write down which.
- **A private-bucket miss surfaces as 403, not 404** — map CloudFront's 403 error
  response to the 404 page, or the themed 404 never renders.
- **`public/CNAME` cannot simply be deleted.** It is *emitted on every build* by
  the `cname` plugin (from `baseUrl`) — a GitHub Pages artifact, useless on
  CloudFront. Disable the plugin in `quartz.config.yaml`; removing the file just
  regenerates it.
- **`.node-version` says v22.16.0** and the guide's workflow reads it via
  `node-version-file`, but this machine currently runs v26. CI will build on 22.
  Reconcile before trusting a green pipeline.

## Not done yet

- **No analytics at all** — that is now a deliberate choice, not an omission. See
  the zero-third-party table above before adding any.
- The **404** uses the site's layout now, but the copy is still Quartz's
  ("Either this page is private or doesn't exist") — that string is hardcoded in
  the built-in emitter, not configurable.
- `content/colophon.md` has no `hosting` row — add one once a platform is picked.
- A **"start here"** list on the homepage is waiting on there being more than one
  note worth pointing at. The `.index-list` utility class is ready for it.
