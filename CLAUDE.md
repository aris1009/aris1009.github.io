# Blog — Claude Notes

Multilingual (en-us, el, tr) security/tech blog. 11ty + Nunjucks + Tailwind, Shoelace for tooltips, Vitest + Playwright.

Stack details and scripts: see `package.json`. Layout: see `src/` tree.

## Contributing & branch policy

All changes to `main` MUST land via PR — direct pushes are prohibited, including for admins ("Include administrators" is enabled). Branch protection requires the `build` check (`.github/workflows/test.yml`: production build, CSS bundle size guard, unit tests, Playwright e2e) to be green before merge. Squash-merge after green.

Even for emergency fixes: open a PR. The bundle size guard rejects changes exceeding `package.json` `bundleSizeLimit.css`.

## Conventions

- **Dictionary tooltips**: `{% dictionaryLink "text", "term" %}`. Test IDs follow `dictionary-{link,tooltip,emoji}-{term}`. Details in `docs/testing.md`.
- **E2E blog post reference**: always use `/blog/en-us/gru-kms-windows/` — oldest committed post, guaranteed in CI. Never reference staged/uncommitted posts.
- **Link processing**: `scripts/process-links.js` regex has known nested-paren limits; `tests/unit/scripts/process-links.test.js` are regression guards. Add cases when new edge cases appear.

## Branch naming and Cloudflare Pages previews

Cloudflare Pages builds **only `blog/*` branches** for preview deployments. Each `blog/<slug>` branch gets a preview URL (`blog-<slug>.<project>.pages.dev`) posted on the PR by the Cloudflare bot.

- Blog post work → `blog/<slug>` (e.g. `blog/cloudflare-pages-setup`).
- Everything else → `fix/`, `chore/`, `feat/`, etc. — by design these do NOT trigger a Pages build.
- Node version for Pages builds is pinned via `.nvmrc`.

Production hosting remains on GitHub Pages; Cloudflare is preview-only.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads

Run `bd prime` for the full workflow and session-close protocol. Use `bd` for all task tracking — never TodoWrite or markdown TODOs. Use `bd remember` for cross-session knowledge — never MEMORY.md.

### Git hooks (husky chain)

Husky sets `core.hooksPath=.husky/_`, so git ignores `.git/hooks/` and `.beads/hooks/`. `bd hooks list` reports green regardless. Each `.husky/<hook>` must call `BD_GIT_HOOK=1 bd hooks run <name> "$@"` so beads can stage `.beads/issues.jsonl` into the commit.

Symptom of a broken chain: `issues.jsonl` keeps showing dirty after `bd` commands. Fix: re-add the `bd hooks run` line to the affected husky hook.
<!-- END BEADS INTEGRATION -->
