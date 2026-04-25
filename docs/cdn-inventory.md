# CDN / third-party origin inventory & secure-loading policy

Source of truth for which external origins the site loads assets from, what
integrity mechanism applies to each, and the policy for future additions.

The CSP lives in `src/_includes/head.njk`. Any change to the tables below
must be reflected there (or vice versa).

## Origins — current state

| Origin | What loads | CSP directive | Required? | Integrity | Availability risk |
|---|---|---|---|---|---|
| `cdn.jsdelivr.net` | Shoelace 2.20.1 `themes/light.css`, `themes/dark.css` | `style-src` | yes | **SRI-pinned (sha384)** | CDN outage → tooltips/controls fall back to unstyled shoelace components |
| `cdn.jsdelivr.net` | Shoelace 2.20.1 `shoelace-autoloader.js` (ESM + chunked `components/*.js`) | `script-src` | yes | **None** — autoloader lazy-imports chunks, so a single SRI tag cannot cover them | CDN outage → interactive shoelace controls (diceware tools, TOC `<sl-details>`) don't upgrade |
| `fonts.googleapis.com` | Roboto Serif CSS stub | `style-src` | yes | **None** — Google serves UA-specific CSS, so SRI is infeasible | Font falls back to system serif; non-executable so supply-chain risk is limited to CSS injection |
| `fonts.gstatic.com` | WOFF2 font files | `font-src` | yes | **None** — referenced indirectly via the googleapis CSS | Font falls back to system serif; fonts cannot execute |
| `cdn.rudderlabs.com` | `rsa.min.js` analytics SDK (production only) | `script-src` | yes (prod) | **None** — `v3` is a rolling version | Beacon drops; site otherwise unaffected |
| `*.dataplane.rudderstack.com` | analytics beacon endpoint | `connect-src` | yes (prod) | N/A (network egress only) | Beacon drops |
| `static.cloudflareinsights.com` | `beacon.min.js` | `script-src` | yes | **None** — Cloudflare rolls the file | Beacon drops |
| `cloudflareinsights.com` | analytics beacon endpoint | `connect-src` | yes | N/A (network egress only) | Beacon drops |

Self-hosted (same-origin, no CDN dependency):

- **Mermaid**: Rollup-bundled via `scripts/build-mermaid.js` into
  `/_static/js/vendor/mermaid/`. Loaded by the `mermaid_js` shortcode in
  `eleventy.config.js`.
- **Prism.js**: Rollup-bundled via `scripts/build-prism.js`.
- **EFF diceware wordlist**: served from `/wordlists/eff_large_wordlist-v1.txt`,
  with a SHA-256 pinned in `src/_data/wordlists.json` and verified at
  runtime in `src/pages/tools/diceware.njk`.

## Removed in blog-6t3

- `polyfill-fastly.io` — the Rudder snippet's "if (!Promise || !globalThis)"
  fallback was unreachable on all supported browsers, and the
  `polyfill.io`/`polyfill-fastly.io` domain was taken over and used to serve
  malware in 2024. Dead branch removed from the inline snippet; origin dropped
  from `script-src`.
- `cdn.jsdelivr.net` from `font-src` — no fonts ever loaded from jsDelivr.
- `unpkg.com` — already removed when mermaid was self-hosted (kept here as a
  note so it does not creep back in).

## Policy — adding a new external dependency

Before adding a new origin to the CSP, pick one of these, in order of
preference:

1. **Self-host via a bundler (Rollup/esbuild).** Same-origin means integrity is
   implicit and no CDN outage can break the site. This is the default for any
   new JS library. Examples: mermaid, prism.
2. **SRI-pinned CDN load** — only if (a) the asset is a single file, (b) the
   CDN serves a stable versioned URL (not a rolling version or dynamic UA
   response), and (c) it is not worth bundling. Always include
   `integrity="sha384-..."` and `crossorigin="anonymous"`.
3. **Unpinned CDN load for executable code** — only for rolling-version beacons
   we cannot bundle (Cloudflare Insights, Rudder SDK). Document the trade-off
   here.
4. **Fonts / non-executable assets** — may be loaded without SRI since they
   cannot execute. Prefer self-hosted WOFF2 if a design refresh is on the
   table anyway.

New analytics beacons go in `connect-src` only. Never add an analytics origin
to `script-src` without also reviewing (3).

## Follow-up work

- Self-host Shoelace: bundle the 9 components actually used
  (`copy-button`, `details`, `divider`, `icon-button`, `radio-button`,
  `radio-group`, `range`, `switch`, `tooltip`) via Rollup, drop
  `cdn.jsdelivr.net` from `script-src` and `style-src` entirely. Tracked in a
  separate bead.
