# verdant

My digital garden, published at [verdantprotocol.com](https://verdantprotocol.com).

Built on [Quartz 5](https://quartz.jzhao.xyz): notes live in `content/` as plain
markdown and are rendered to static HTML at build time. The one dynamic piece is
a visitor counter — a Lambda reading DynamoDB — served same-origin behind
CloudFront (see [How this deploys](#how-this-deploys-aws)).

**Map:** design and privacy → [The design](#the-design) · local Quartz forks →
[Local modifications](#local-modifications-to-quartz) · AWS / CRC →
[How this deploys](#how-this-deploys-aws) · open work → [Known gaps](#known-gaps-in-the-deploy-itself)
and [Not done yet](#not-done-yet).

## Running it

```bash
npx quartz plugin install --from-config   # first checkout / after plugin changes
npx quartz build --serve                  # http://localhost:8080, rebuilds on save
npx quartz build                          # write static output to public/
./fix-routing.sh                          # required before any S3 sync — see deploy gotchas
```

**Deploy is CI-first.** Pushes to `main` that touch site-affecting paths run
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): install plugins
from config → build → `fix-routing.sh` → OIDC assume-role → `aws s3 sync` →
CloudFront invalidation. Manual laptop deploy still works as a fallback:

```bash
npx quartz build && ./fix-routing.sh && aws s3 sync public/ s3://BUCKET/ --delete
# then invalidate CloudFront for HTML/JS if the distribution caches them
```

A clean checkout needs `npx quartz plugin install --from-config` before the first
build (plain `plugin install` is wrong for vendored plugins — see
[Gotchas](#gotchas-this-repo-already-knows-about)).

## Where things are

| path                          | what                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `content/`                    | the notes; everything else is machinery                       |
| `content/robots.txt`          | crawler allow + sitemap pointer                               |
| `quartz.config.yaml`          | theme, plugins, layout                                        |
| `quartz/styles/custom.scss`   | all custom styling                                            |
| `quartz/static/`              | portrait plates, dual favicon tiles, og-image                 |
| `plugins/`                    | vendored: `footer`, `status`, `tag-index`, `content-index`, `sidenotes` |
| `infra/visit-counter/`        | Lambda source for the visitor counter (console-deployed)      |
| `.github/workflows/deploy.yml`| frontend deploy (OIDC → S3 → CloudFront)                      |
| `fix-routing.sh`              | post-build rewrite for CloudFront clean URLs                  |
| `scripts/`                    | portrait + favicon generation (`dither-portrait.py`)          |

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

> **Gotcha:** `status: draft` is *not* `draft: true`. The first is cosmetic (the
> dot) and leaves the note **fully published**. The second is the `remove-draft`
> plugin's flag and drops the page from the build entirely. A note marked
> `status: draft` is public on purpose.

**`description:` is a permanent italic subtitle**, not a collapsible Properties
table. Stock `note-properties` renders frontmatter in a `<details>` that
remembers collapse in `localStorage` — which made subtitles flash then vanish.
`custom.scss` strips the chrome and keeps the body visible; `plugins/status`
clears the sticky collapse key on each SPA nav. See
[Local modifications](#local-modifications-to-quartz).

**Sidenotes, not endnotes.** Markdown footnotes are relocated at build time by
`plugins/sidenotes` into Tufte-style margin notes in the gutter beside the prose
(inline below desktop). Zero client JavaScript — the colophon's first-party
claim stays intact.

**Hierarchy is loud at the top, quiet below.** Article titles use a display-sized
`clamp`; in-article `h2`s carry a small structural green mark. The resume page
gets a **density mode** (wider measure, tighter lists) so a CV can be skimmed
inside the same type system.

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
white — both ink-on-transparency, so each sits on the page ground. Each is 96px
displayed at 192px — an exact 2× integer scale, so every dither dot lands as a
clean 2×2 block. **Any non-integer scale resamples the dots and ruins it.**
Regenerate rather than resize:

```bash
python3 scripts/dither-portrait.py path/to/photo.jpg   # needs pillow
python3 scripts/dither-portrait.py --icons-only        # favicons only, from plates
```

The portrait and the wordmark under it are a single **link home**: the plate is a
`::before` on the title's *anchor*, not the `<h2>`, so clicking the headshot
navigates — what people expect of a site mark. It is centred in the 320px desktop
rail and left-aligned on mobile, where the whole left sidebar reflows (via
`display: contents`) to put the article first and drop recent/tags below it —
otherwise a phone buried every note under the navigation.

**The favicon is the same headshot, not the stock Quartz crystal.** Bare
ink-on-transparency fails at tab size: black ink vanishes into dark browser
chrome (and white into light). So each favicon is the matching plate composited
onto an **opaque site-surface tile**:

| file | contents | when |
| ---- | -------- | ---- |
| `static/icon.png` | light plate on `lightMode.light` (`#f1f2ec`) | light OS chrome + fallback |
| `static/icon-dark.png` | dark plate on `darkMode.light` (`#0e0f0e`) | dark OS chrome |
| `favicon.ico` | 48×48 from `icon.png` (favicon plugin) | legacy clients; no media query |

`Head.tsx` emits three `<link rel="icon">` tags: light and dark gated by
`prefers-color-scheme`, plus a bare light fallback. The surface hexes are
duplicated in `scripts/dither-portrait.py` (`LIGHT_BG` / `DARK_BG`) — if the
theme colours in `quartz.config.yaml` move, update those constants and re-run
`--icons-only`.

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

**`quartz/components/Head.tsx`** — several changes. (1) Removed an unconditional
`<link rel="preconnect" href="https://cdnjs.cloudflare.com">`. Quartz emits it on
every page to warm up mermaid's lazy import, **outside any config gate** — so
disabling mermaid does not remove it. It opened a connection to Cloudflare on
every visit, handing each visitor's IP and user-agent to a third party whether or
not a diagram existed. Re-add it if mermaid is ever turned back on. (2) The
`og:url`/`twitter:url` now run the slug through `simplifySlug`, so the homepage
emits the apex rather than `/index`; added a matching `<link rel="canonical">`,
which Quartz omits by default. (3) `og:type` is `article` for `notes/*` and
`website` elsewhere (Quartz hardcodes `website`). (4) The 404 gets
`<meta name="robots" content="noindex">` and **no** canonical — a canonical
pointing every missing URL at the homepage is wrong. (5) Favicons are the 1-bit
portrait tiles (`static/icon.png` / `static/icon-dark.png`) with
`prefers-color-scheme` media queries plus a light fallback — Quartz only links
`static/icon.png`. See [The design](#the-design) for why the tiles are opaque.

**`quartz/plugins/pageTypes/404.ts`** — set `data.unlisted = true` on the
generated 404 page, so `recent-notes`, the sitemap, and RSS all drop it. It is a
page, not a note; the flag is set directly rather than via frontmatter because
this page skips the transformer that would normally copy it across. Replaces an
earlier `custom.scss` `:has()` rule that only hid the link visually, leaving it
in the markup for crawlers.

**`quartz/components/pages/404.tsx`** — replaced the stock i18n copy ("Either
this page is private or doesn't exist" / "Return to homepage") with the site's
own lowercase wording ("there's nothing at this address…", "← back home"). The
case-insensitive slug-redirect script is kept.

**`quartz/components/scripts/popover.inline.ts`** — two changes, both tracked in
git. First, bail out of empty popovers: content types with no renderer (e.g.
`application/xml`, i.e. the RSS link) produced a blank floating box on hover.
Second, skip `.tag-link` entirely — a tag popover previewed a tag listing page,
covering the article to report the tag name and a count.

**`plugins/footer/`** — a vendored footer, pointed at from the config by local
path (`source: ./plugins/footer`). The upstream `@quartz-community/footer`
hardcodes a "Created with Quartz" credit with no option to disable it. It also
renders the **visitor counter** (challenge step 7): a one-line `views · N` under
the links, typed as metadata rather than a widget. The counter lives *in the
footer component* rather than its own plugin because Quartz's `footer` layout
slot holds exactly one component (`cfg.ts` declares `footer: QuartzComponent`,
singular) — a second one is dropped with no warning. It POSTs once per browser
session to the same-origin `/api/visit`, reads with `GET /api/stats` thereafter,
and removes itself if the API is unreachable — a dead counter is worse than
none. The session flag is set *before* the fetch, because Quartz fires `nav`
twice per load and a flag set after `await` let one load count as two visitors.
If `POST` fails (throttle, origin check, 5xx), it **falls back to `GET /api/stats`**
so the number still shows without counting — same fail-soft rule. Backend details
live under [Visitor counter](#visitor-counter). On `/colophon` only, the footer also
prints a **build stamp** (`git describe` + UTC date) so a systems reader can match
the live site to a commit.

**`plugins/status/`** — renders `status:` frontmatter as a dot + label.
`note-properties` is the only stock plugin that prints a frontmatter value, and
it prints an undifferentiated `<tr>` with **no per-property hook** — there is no
way to style `status` apart from `description` in CSS alone. Hence a component.
It also ships a small `afterDOMLoaded` script that keeps `details.note-properties`
open and clears the stock plugin's `note-properties-collapsed` localStorage key,
so description subtitles cannot be sticky-hidden after SPA navigation.

**`plugins/sidenotes/`** — a rehype transformer (not a layout component): moves
GFM footnote bodies from the end-of-article section into `<aside class="sidenote">`
next to the referencing block. CSS floats them into the measure gutter on
desktop. Build-time only — no browser JS.

**`plugins/tag-index/`** — the sidebar list of every tag, with counts. Quartz has
no site-wide tag component: `tag-list` renders only the *current page's* tags, and
`explorer` is a file tree. The `/tags/*` pages were already being emitted by
`tag-page` and **nothing linked to them** — they were reachable only by clicking a
chip on a note you had already found. Counts derive from `allFiles`, so they
follow frontmatter with no list to maintain.

**`plugins/content-index/`** — the sitemap / RSS / `contentIndex.json` emitter,
vendored to fix a **polluted RSS feed**. The stock feed listed folder listings
(`notes`) and every tag page (`cloud`, `Tag Index`, …) plus the homepage as
items; generated/undated pages get `new Date()`, so they sorted above real notes
*and* re-dated to "today" every build — noise for subscribers. The vendor patch
adds one filter (`isNonNoteSlug`) so RSS carries **only notes**; the sitemap and
`contentIndex.json` are built from a separate loop and still index everything.
Unlike the hand-written plugins above, this one is the upstream **bundled `dist`**
(`@quartz-community/content-index`) copied verbatim except the patch — it is
self-contained (imports only `path` and `fs`), so it needs no build step and no
`node_modules`. The patch is marked `VENDOR PATCH` in the file.

> All of the above under `plugins/` (and the small Quartz core edits) are
> **tracked in git**, not patched into the gitignored `.quartz/`. A fetched
> plugin is refetched in CI, so a local-only patch would make CI silently emit
> different HTML than a laptop build — the build-drift you would flag in a
> security review. Vendoring keeps local and CI byte-identical. Quartz is
> credited on `/colophon`; `LICENSE.txt` is retained (MIT).
>
> `npx quartz plugin install` reports "failed to update" for each local-path
> plugin — **expected**: there is no remote to pull; the build uses the local
> copy regardless.
>
> **Gotcha:** for *components*, Quartz's loader imports from the package's
> `./components` subpath export, *not* the main entry — each re-exports through
> `components.js`. (`content-index` is an emitter, not a component, so it exports
> its factory straight from the main entry instead.)

## Git

- `origin` — [verdantpro/verdant_cloud](https://github.com/verdantpro/verdant_cloud), branch `main`.
- `upstream` — jackyzha0/quartz, for pulling Quartz updates.

**History.** GitHub still holds the deep Quartz lineage on `origin` when fetched
fully, so `git merge upstream/v5` can work from a non-shallow clone that shares
that ancestor. A shallow checkout (`git rev-parse --is-shallow-repository`) will
look like a short private history and block merge-base walks — run
`git fetch --unshallow` (or a full clone) before merging upstream. Core edits such
as `quartz/components/scripts/popover.inline.ts` still need merge care either way.
The contributor graph on a full history is mostly Jacky's; on a shallow or
rewritten view it will not be.

## How this deploys (AWS)

**Live at <https://verdantprotocol.com>.** This is the [cloud resume challenge,
AWS edition](https://cloudresumechallenge.dev/docs/the-challenge/aws/) — **not**
GitHub/Cloudflare Pages. Standing up the abstraction is the point of the exercise.

Originally planned on GCP; switched to AWS after the GCP account was blocked at
signup. AWS is also the better fit here: HTTPS needs no paid load balancer
(CloudFront + a free ACM cert), and the bucket can stay private.

### CI (frontend)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) deploys on push to
`main` when site-affecting paths change (`content/`, `quartz/`, `plugins/`,
config, `fix-routing.sh`, or the workflow itself), and on
`workflow_dispatch`. README-only pushes do **not** deploy.

| GitHub | Name | Role |
| ------ | ---- | ---- |
| **Secret** | `AWS_DEPLOY_ROLE_ARN` | IAM role assumed via OIDC (no long-lived keys in GitHub) |
| **Variable** | `S3_BUCKET` | bucket name only (e.g. `verdantprotocol`) |
| **Variable** | `CLOUDFRONT_DISTRIBUTION_ID` | distribution id for `/*` invalidation |

The role needs `s3:ListBucket` on the bucket ARN (no `/*`), object R/W on
`bucket/*`, and `cloudfront:CreateInvalidation` on the distribution. Trust
`token.actions.githubusercontent.com` for
`repo:verdantpro/verdant_cloud:ref:refs/heads/main`. Steps must use
`npx quartz plugin install --from-config` (not plain install) before build — see
gotchas.

```
push main (path filter) → Actions: plugin install --from-config → quartz build
                        → ./fix-routing.sh → OIDC → s3 sync --delete → CF invalidate
                                          |
                                          v
                              CloudFront distribution
                              ACM cert (us-east-1) · Route 53 alias (apex; www 301s to apex)
                                /                         \
                        behavior *                    behavior /api/*
                            |                             |  CachingDisabled, POST allowed,
                            v                             |  Host header stripped
                  S3 (private, OAC)                       v
                  + viewer function                 API Gateway (HTTP API v2)
                  (uri + "/index.html")             GET|HEAD /api/stats · POST /api/visit
                                                      → Lambda (python) → DynamoDB (site-stats)
```

Verified against the live site (re-check after big deploys): Route 53 nameservers,
CloudFront in front of an S3 origin, an Amazon-issued cert covering both
`verdantprotocol.com` and `www.verdantprotocol.com`, clean URLs resolving in
subpaths, a real 404 on a missing path, `www` returning to the apex, and
`GET /api/stats` returning counter JSON through CloudFront (no `execute-api`
host reaches the browser).

**Security headers** are set by a CloudFront response headers policy on both
behaviors: `Strict-Transport-Security: max-age=63072000; includeSubDomains`
(deliberately **no `preload`** — that is a one-way door and hard to reverse),
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
and `X-Frame-Options: DENY`. Origin-override is on, so the policy stays
authoritative if an origin ever emits its own. Console-managed, like the rest.

### Visitor counter

Same-origin only: the browser calls `/api/stats` and `/api/visit` on
`verdantprotocol.com`. CloudFront's `/api/*` behavior forwards to API Gateway
(HTTP API) → Lambda `site-stats` → DynamoDB table `site-stats`. That keeps the
colophon's "every request goes to this domain" true.

| Layer | Role |
| ----- | ---- |
| Footer (`plugins/footer/`) | One `POST` per browser session (`sessionStorage`), then `GET`; fail-soft; GET-fallback if POST fails |
| API routes | `GET`/`HEAD` `/api/stats`, `POST` `/api/visit` |
| Lambda | Source of truth in-repo: [`infra/visit-counter/handler.py`](infra/visit-counter/handler.py) (deploy by pasting/uploading to the console function; handler name in AWS is `lambda_function.handler`) |
| DynamoDB | `pk` string key. Lifetime total on `pk=site`; per-day count on `day#YYYY-MM-DD`; per-IP-per-day dedup on `IP#<salted-hash>#YYYY-MM-DD` with TTL |

**Env vars on the Lambda** (must be real values — not prose placeholders):

| Key | Meaning |
| --- | ------- |
| `TABLE_NAME` | e.g. `site-stats` |
| `IP_HASH_SALT` | long random secret; salts the IP hash so table rows are not reversible offline |
| `ALLOWED_ORIGINS` | comma-separated origins, e.g. `https://verdantprotocol.com,https://www.verdantprotocol.com` |

> **Gotcha:** if `ALLOWED_ORIGINS` is set to something that is not a real origin
> string (e.g. a note like `apex + www`), every browser `POST` sends
> `Origin: https://…` and the Lambda returns **403**. CloudFront maps **403 →
> `/404.html`** for private-S3 misses (see below), so a mis-set origin list looks
> exactly like a broken route: HTML 404, `server: AmazonS3`, no
> `apigw-requestid`. Fix the env var; do not chase path patterns first.

Client IP for dedup: prefer `CloudFront-Viewer-Address` if the origin request
policy forwards it; otherwise the first hop of `X-Forwarded-For`. Do **not** key
dedup on API Gateway `sourceIp` alone behind CloudFront — that is often the edge,
not the visitor, and would undercount badly.

A public counter is never unforgeable (many IPs, proxies). Throttle +
per-IP-per-day conditional put is anti-script friction, not an audit metric.
Stage throttle is set on the HTTP API `$default` stage.

Like the rest of the stack, the live API/Lambda/table wiring is still
**console-managed**, not Terraform. The Python in `infra/` is what should be
deployed when the function is updated.

### Known gaps in the deploy itself

- **Frontend CI is in; IaC is not.** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
  builds and publishes the static site via OIDC. The bucket, distribution,
  functions, cert, DNS, *and* the counter's API Gateway, Lambda, and DynamoDB
  table were all clicked together in the console — none of that resource graph
  is Terraform (or similar). The challenge still asks for IaC; counter *logic*
  lives in `infra/visit-counter/`, the cloud resources do not.
- **Lambda/API wiring is still console-updated.** Changing `handler.py` in git
  does not deploy the function until someone pastes or uploads it in AWS.

### Gotchas this repo already knows about

- **CI must run `npx quartz plugin install --from-config` before `quartz build`.**
  A clean checkout cannot build without it — `Head.tsx` imports a generated
  `.quartz/plugins` index that does not exist until plugins are installed, and
  `.quartz/` is gitignored. Plain `plugin install` (from the lockfile) can
  re-resolve vendored plugins to stale upstream copies. The workflow uses
  `--from-config` on purpose. This is also why the footer is vendored rather
  than patched (see above).
- **Clean URLs — settled: folder convention.** Quartz links to
  `/notes/why-cloud`, but the build emits `notes/why-cloud.html`, and
  CloudFront's default-root-object only applies at `/`, not in subpaths.
  `./fix-routing.sh` runs after `quartz build` and rewrites every flat
  `page.html` into `page/index.html` (leaving `index.html` and `404.html`
  alone), so the viewer-request CloudFront Function rewrites
  `req.uri = uri + "/index.html"` — *not* `+ ".html"`. **The build is not
  deployable without that script**; the Actions job runs it between
  `quartz build` and the S3 sync. Shipping flat `*.html` without the rewrite
  leaves clean paths 404 while `path.html` still works.
- **A private-bucket miss surfaces as 403, not 404** — CloudFront maps **403 →
  `/404.html`** (with response status 404) so the themed page renders. That same
  mapping rewrites **any** origin 403, including API Gateway/Lambda `403` on
  `/api/*`, into the HTML 404 page. Prefer debugging API failures against the
  `execute-api` URL (JSON body + `apigw-requestid`) before blaming routing.
- **`/api/*` must allow POST** on the CloudFront behavior (not GET/HEAD only),
  use a non-caching policy, and forward viewer headers the Lambda needs for IP
  (at least `X-Forwarded-For` / `CloudFront-Viewer-Address` as configured).
- **`public/CNAME` was a GitHub Pages artifact** emitted on every build by the
  `cname` plugin (from `baseUrl`), useless on CloudFront. The plugin is now
  disabled in `quartz.config.yaml`, so the file is no longer produced — deleting
  it by hand never worked, since the build regenerated it. A stale copy may still
  sit in the S3 bucket until the next `aws s3 sync --delete`.
- **`.node-version` pins Node 22** for CI (`actions/setup-node` reads that file).
  Local machines may run newer Node; trust the pipeline's 22.x build for what
  ships.
- **Description subtitles and `note-properties`.** If a description flashes under
  the title then disappears, the stock plugin closed the Properties `<details>`
  via `localStorage`. The status plugin + CSS fix above should prevent that; a
  hard reload clears a sticky key if an old tab still has it.
- **Favicon cache is sticky.** Browsers ignore normal reloads for icons;
  `Head.tsx` uses `?v=` on the icon URLs — bump that number when the tiles change.

## Not done yet

- **No analytics at all** — deliberate, not an omission. See the zero-third-party
  table above before adding any.
- The homepage links to one note (`on ai writing...`) as a "start here". Because
  backlinks are earned by real links, only linked notes show a "linked from
  verdant protocol" — notes nothing links to show none. As the garden grows,
  either link new notes from the homepage deliberately or lean on `/notes`, which
  indexes them all automatically.
- **Infrastructure-as-code** for the AWS resource graph (called out under Known
  gaps) — still the main CRC debt after frontend CI.
- **`/now`** may exist as unlisted content for personal use; it is not in the
  footer until it is real.
