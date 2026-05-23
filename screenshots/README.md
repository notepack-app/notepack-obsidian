# NotePack screenshot harness

Drives a sandboxed Obsidian (auto-downloaded by [`wdio-obsidian-service`](https://github.com/jesse-r-s-hines/wdio-obsidian-service)) with the local NotePack plugin side-loaded into `screenshots/fixture-vault/`. Each scene module in `screenshots/scenes/` opens a view or state and saves a PNG to `docs/screenshots/`.

## Run

```sh
pnpm run build       # produce main.js + styles.css for side-load
pnpm screenshots     # render fixture-vault, boot Obsidian, run scenes, write PNGs
```

First run downloads Obsidian into `.obsidian-cache/` (~500 MB, cached for future runs).

## Layout

```
screenshots/
  all.e2e.ts                 # mocha dispatcher; iterates scenes
  render.ts                  # CLI: source fixture-vault -> .fixture-vault-rendered
  scenes/<name>.ts           # one scene per file (default export)
  lib/
    types.ts                 # Scene + SceneContext types
    plugin-handle.ts         # NotePack/Obsidian helpers
    render-fixtures.ts       # date-shift render module (AUTHORED_AS_OF + renderFixtures)
    __tests__/
      render-fixtures.test.ts
  fixture-vault/             # checked-in templated vault (real ISO dates anchored to AUTHORED_AS_OF)
  .fixture-vault-rendered/   # gitignored output of `pnpm screenshots:render`
wdio.conf.mts                # WebdriverIO config (window size, Obsidian version, vault path)
docs/screenshots/<name>.png  # capture output
```

## Scene contract

Each `screenshots/scenes/<name>.ts` default-exports:

```ts
import type { Scene } from "../lib/types";

const scene: Scene = {
  name: "kebab-name",                  // becomes the PNG filename
  description: "what the scene shows", // shown in the mocha reporter
  async capture({ browser, save }) {
    // drive Obsidian via helpers in ../lib/plugin-handle
    await save();                      // writes docs/screenshots/kebab-name.png
  },
};
export default scene;
```

`SceneContext.save(suffix?)` writes `docs/screenshots/<name>[-<suffix>].png`. It also resizes the right sidebar to `SCREENSHOT_RIGHT_SIDEBAR` (default 460px) before screenshotting, so per-scene visuals stay consistent.

## Helpers (`screenshots/lib/plugin-handle.ts`)

- `openMyTodos(browser)` — runs `notepack:show-my-todos`
- `openTeamTodos(browser)` — runs `notepack:show-team-todos`
- `openRecentFiles(browser)` — runs `notepack:show-recent-files`
- `openSettingsTab(browser, tabId = "notepack")` — opens Obsidian settings to a specific tab
- `openFile(browser, path)` — opens a vault file in the active leaf
- `openFirstMarkdownFile(browser)` — opens the first markdown file alphabetically
- `openCommandPaletteFiltered(browser, query)` — opens the command palette, pre-fills the filter
- `closeAllModals(browser)` — dismisses settings + any open modal overlays
- `setRightSidebarWidth(browser, px)` — expands and sizes the right sidebar
- `settle(browser, ms = 800)` — waits for animations / layout

Keep scenes thin; brittleness lives in helpers.

## Adding a scene

1. Create `screenshots/scenes/<new-name>.ts` matching the contract.
2. Add a static import and append to the `scenes` array in `screenshots/all.e2e.ts`. Top-level await is not available under wdio's CJS transform, so scenes are statically imported.

## Configuration

Environment overrides for the dispatcher:

| Env var | Default | Effect |
|---|---|---|
| `SCREENSHOT_WIDTH` | `1440` | Window width (px) |
| `SCREENSHOT_HEIGHT` | `900` | Window height (px) |
| `SCREENSHOT_RIGHT_SIDEBAR` | `460` | Right sidebar width (px) |
| `OBSIDIAN_VERSIONS` | `latest/latest` | Passed to `parseObsidianVersions`; pin a version for stable visuals |

Window size is set via Electron's `BrowserWindow.setSize()` in the `before()` hook. The Chrome `--force-device-scale-factor=1` arg ensures 1× pixel-perfect captures on Retina displays.

### Render-time flags

```sh
pnpm screenshots:render                     # uses today
pnpm screenshots:render --today=2026-12-01  # deterministic re-render
```

(`--today=YYYY-MM-DD` is useful for reproducing past or future urgency distributions while iterating on scenes.)

## Fixture vault

`screenshots/fixture-vault/` is the source of truth for fixture content — checked into the repo. Files are authored using **real literal ISO dates anchored to `AUTHORED_AS_OF`** (the constant in `lib/render-fixtures.ts`, currently `2026-05-23`). Each `pnpm screenshots` run invokes `screenshots:render`, which:

- Computes `delta = today - AUTHORED_AS_OF` (in whole UTC days)
- Walks `fixture-vault/` and emits a parallel tree to `.fixture-vault-rendered/`, shifting every literal `\b\d{4}-\d{2}-\d{2}\b` it finds — in filename segments AND file contents — by `delta`

Because every date shifts by the same delta, all relative offsets between filename dates and inline todo dates are preserved. `wdio-obsidian-service` reads from `.fixture-vault-rendered/` (per `wdio.conf.mts`) and copies it to its own temp dir per session, so scenes can still mutate freely without dirtying anything.

The fixture deliberately mixes:
- Multiple team-member folders (`Team/<Name>/README.md`) for `@mention` syntax exercise
- Date-prefixed meeting notes (`Meetings/2026-05-XX <topic>.md`) so file-date relative resolution is exercised
- A mix of overdue / due-today / due-soon / undated todos — distribution is stable across calendar time thanks to the render layer

### Authoring new fixture files

Write dates as if today is `AUTHORED_AS_OF`. For example, to create a meeting note dated "two days ago" with a todo due "in five days", on an anchor of `2026-05-23` you would create:

```
Meetings/2026-05-21 New Meeting.md
  contents: "- [ ] follow up due 2026-05-28"
```

The renderer will shift both dates by the same delta when the screenshots run, preserving the "2 days ago" and "5 days from now" semantics.

To bump the anchor (e.g. after a major fixture rewrite), update the `AUTHORED_AS_OF` constant in `lib/render-fixtures.ts` and re-author every fixture date against the new anchor.

## Determinism

Within a run, captures are deterministic: scenes execute sequentially in `maxInstances: 1`, the window size is forced, and `wdio-obsidian-service` resets the (rendered) fixture per session.

The render layer (see Fixture vault above) keeps the **distribution** of urgency bands (overdue / due-today / due-soon / undated) stable across calendar time. The literal calendar dates rendered in screenshots will vary day-to-day — that is expected.

## Why `wdio-obsidian-service` over alternatives

| Approach | Reliability | Complexity | Verdict |
|---|---|---|---|
| `wdio-obsidian-service` (DOM driving) | High — deterministic, pixel-perfect | Medium — one-time wdio setup | **Chosen** |
| Computer Use API | Medium — visual model, timing-sensitive | High — API loop + retry logic | Rejected |
| Claude Cowork | Medium — visual UI agent, non-deterministic | Low — but not invokable from a skill | Rejected |
