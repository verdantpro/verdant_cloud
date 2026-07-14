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
| `plugins/`                  | vendored components (see below)            |
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

**Motion answers the pointer; it never performs on arrival.** Two gestures, both
pure CSS: a blinking block cursor after the homepage title, and a `>` marker that
slides into the gutter when you hover a link in a list. Nothing fades or types
itself in — a terminal is instant, and an entrance animation is a toll the reader
pays on every visit to a page they came back to re-read. If a flourish is wanted,
it goes on interaction, not on load. `prefers-reduced-motion` is honoured (the
cursor settles lit rather than blinking).

**Two measures, not one.** `--line-measure` (34rem) is *prose*: at 0.9rem mono
that lands ~65 characters, which is the readability target and the reason the
column is not simply "as wide as the page". `--wide-measure` (42rem) is for
things read as **pictures rather than sentences** — code, tables, ASCII diagrams
— where line length is irrelevant and wrapping a Terraform block at 65 characters
is actively worse. Widening the prose to match would *lower* readability, not
raise it. Both are capped per breakpoint against the fixed 320px rails, which do
not shrink; without that cap a wide centre pushes the grid off a 1280px laptop.

**Diagrams are ASCII in a fenced block**, not mermaid. Mermaid is off for privacy
(see the table above), and a hand-drawn tree in a `pre` fits a terminal aesthetic
better than a rendered flowchart anyway — zero third-party requests, no plugin,
and `--wide-measure` gives it room. Reach for this before reaching for a library.

**Notes carry a `status:`.** `draft` renders a hollow dot, `stable` a filled green
one; any other value renders in grey, and a note with no `status` renders nothing
at all. The site claims its notes are "unfinished on purpose" — this is what makes
that claim checkable instead of merely asserted.

**Folder and tag listings are a ledger** — title left, date ruled flush right,
one hairline per row. This styles `.page-listing`, the markup Quartz already
emits for `/notes` and `/tags/*`, so the dates come from frontmatter and no list
is maintained by hand. Note the component right-aligns its own tag chips; that is
overridden back to flush-left.

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

Traps that each look identical from the outside ("my rule isn't applying") and
have different causes. Every one of these has cost real time:

- The general column rule is `.page > #quartz-body .center` — it contains an
  **ID**, and an ID outranks any number of classes. A class-only selector loses
  silently, and can apply some properties while losing others.
- `base.scss` sets **`min-width: 100%`** on `.center` and `footer`. `min-width`
  beats `max-width`, so a width cap does nothing until you reset it to `0`.
- `#quartz-body` is a **grid**. `margin: auto` on a grid item resolves to `0`;
  centre with `justify-self`. Mind `box-sizing` too — the footer is `border-box`
  and `.center` is not, which offsets them by exactly their padding.
- **The centre column is an `auto` track** (`templateColumns` in
  `variables.scss`), so it sizes to its *contents*. Prose has a huge max-content
  width and fills the column; a listing (short titles, one date) has a narrow one
  and **collapses** it — `/notes` and `/tags/*` rendered ~240px wide until
  `.center` was given a definite `width`. The measure was only ever a ceiling,
  never a floor. Any page whose content is intrinsically narrow will do this.
- **There is no `.toolbar` element.** Search and the theme toggle are wrapped in a
  generic `.flex-component` (one per page, in the left sidebar). A rule written
  against `.toolbar` compiles cleanly, matches nothing, and ships inert — the
  "icons recede until hovered" effect sat dead in the stylesheet for weeks.
- **`body[data-slug="…"]` also matches link previews.** `data-slug` is on
  `<body>`, so it scopes to the page you are *standing on* — and a popover renders
  the **linked** page's markup into that same body. A rule keyed on the slug will
  therefore hit every preview opened from that page. Contain it (`.center >`) or
  it leaks.

Measure with `getComputedStyle` rather than trusting a screenshot — but if the
property is **transitioned, read it after the transition, not in the tick you
trigger it**, or you will sample the starting value and conclude a working rule
is broken. And if a change seems not to apply at all, hard-reload before
re-debugging: the dev server serves cached JS and CSS, which has twice looked
like a broken fix.

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

**`plugins/status/`** — renders `status:` frontmatter as a dot + label.
`note-properties` is the only stock plugin that prints a frontmatter value, and
it prints an undifferentiated `<tr>` with **no per-property hook** — there is no
way to style `status` apart from `description` in CSS alone. Hence a component.

**`plugins/tag-index/`** — the sidebar list of every tag, with counts. Quartz has
no site-wide tag component: `tag-list` renders only the *current page's* tags, and
`explorer` is a file tree. The `/tags/*` pages were already being emitted by
`tag-page` and **nothing linked to them** — they were reachable only by clicking a
chip on a note you had already found. Counts derive from `allFiles`, so they
follow frontmatter with no list to maintain.

> All three are plain JS with no build step, and all three are **tracked in git**
> rather than patched into the gitignored `.quartz/` — same reasoning as the
> footer: a fetched plugin gets refetched in CI, so a local patch would make CI
> silently emit different HTML than a local build.
>
> **Gotcha:** Quartz's loader imports components from the package's `./components`
> subpath export, *not* from the main entry. A component exported only from
> `index.js` will not be found. Each package re-exports through `components.js`.

> This started as a patch to the fetched plugin in `.quartz/` — which is
> **gitignored**, so CI would have refetched the plugin and silently emitted
> different HTML than a local build. That is exactly the build-drift you would
> flag in a security review, so the component is vendored instead: tracked, no
> fetch, local and CI byte-identical. Quartz is credited on `/colophon`, and
> `LICENSE.txt` is retained, which is what MIT actually requires.

## Git

- `origin` — [verdantpro/verdant_cloud](https://github.com/verdantpro/verdant_cloud), branch `main`.
- `upstream` — jackyzha0/quartz, for pulling Quartz updates.

The full Quartz history was kept (~1878 commits), so `git merge upstream/v5`
stays straightforward. It also means the contributor graph is mostly Jacky's,
and that `quartz/components/scripts/popover.inline.ts` will need merge care.

## How this deploys (AWS)

**Live at <https://verdantprotocol.com>.** This is the [cloud resume challenge,
AWS edition](https://cloudresumechallenge.dev/docs/the-challenge/aws/) — **not**
GitHub/Cloudflare Pages. Standing up the abstraction is the point of the exercise.

Originally planned on GCP; switched to AWS after the GCP account was blocked at
signup. AWS is also the better fit here: HTTPS needs no paid load balancer
(CloudFront + a free ACM cert), and the bucket can stay private.

```
npx quartz build                 emits public/ (flat page.html)
./fix-routing.sh                 rewrites to page/index.html  <-- REQUIRED
aws s3 sync public/ ...          by hand, from a laptop       <-- not automated yet
                                   |
                                   v
                                 S3  --Origin Access Control-->  CloudFront
                                                                   + ACM cert (us-east-1)
                                                                   + CloudFront Function
                                                                     (uri + "/index.html")
                                                                   |
                                 Route 53 A/AAAA alias  <-----------+
                                 (apex AND www)
```

Verified against the live site: Route 53 nameservers, CloudFront in front of an
S3 origin, an Amazon-issued cert covering both `verdantprotocol.com` and
`www.verdantprotocol.com`, clean URLs resolving in subpaths, and a real 404 on a
missing path.

Backend (separate repo): API Gateway HTTP API → Lambda (Python) → DynamoDB, all
in Terraform, CI via GitHub OIDC — **no stored AWS credentials anywhere**.

### Known gaps in the deploy itself

- **There is no CI.** No `.github/` in this repo — deploys are a manual
  `aws s3 sync` from a laptop, which means the deployed site can silently drift
  from `main`. It already did once: `my-name.md` and `fix-routing.sh` were live
  before they were ever committed. Automating this (GitHub Actions + an OIDC
  role, no stored keys) is the next real task.
- **No infrastructure-as-code for the frontend.** The bucket, distribution,
  function, cert, and DNS records are not described in Terraform anywhere in this
  repo, so none of it is reproducible or reviewable. The challenge asks for IaC;
  this is where it's owed.
- **`www` serves a second copy of the site instead of redirecting to the apex.**
  Both hostnames return `200` with identical content, and no `rel="canonical"` is
  emitted, so search engines see duplicate content at two origins. Pick the apex
  as canonical and 301 `www` to it (CloudFront Function, or a second distribution).

### Gotchas this repo already knows about

- **CI must run `npx quartz plugin install` before `quartz build`.** A clean
  checkout cannot build without it — `Head.tsx` imports a generated
  `.quartz/plugins` index that does not exist until plugins are installed, and
  `.quartz/` is gitignored. The guide's sample workflow shows
  `npm ci && npx quartz build`; that will fail here. This is also why the footer
  is vendored rather than patched (see above).
- **Clean URLs — settled: folder convention.** Quartz links to
  `/notes/why-cloud`, but the build emits `notes/why-cloud.html`, and
  CloudFront's default-root-object only applies at `/`, not in subpaths.
  `./fix-routing.sh` runs after `quartz build` and rewrites every flat
  `page.html` into `page/index.html` (leaving `index.html` and `404.html`
  alone), so the viewer-request CloudFront Function rewrites
  `req.uri = uri + "/index.html"` — *not* `+ ".html"`. **The build is not
  deployable without that script**; any CI job must run it between
  `quartz build` and the S3 sync.
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
- `content/colophon.md` has no `hosting` row — the platform is now picked (S3 +
  CloudFront), so this is just owed.
- A **"start here"** list on the homepage is waiting on there being more than one
  note worth pointing at. `/notes` already renders the ledger automatically, so
  this only needs doing if the homepage should point at a curated subset.
