# NotePack screenshot harness

Drives a sandboxed Obsidian (auto-downloaded by [`wdio-obsidian-service`](https://github.com/jesse-r-s-hines/wdio-obsidian-service)) with the local NotePack plugin side-loaded into `screenshots/fixture-vault/`. Each scene module in `screenshots/scenes/` opens a view or state and saves a PNG to `docs/screenshots/`.

## Run

```sh
pnpm run build       # produce main.js + styles.css for side-load
pnpm screenshots     # boot Obsidian, run scenes, write PNGs
```

First run downloads Obsidian into `.obsidian-cache/` (~500 MB, cached for future runs).

## Layout

```
screenshots/
  all.e2e.ts                 # mocha dispatcher; iterates scenes
  scenes/<name>.ts           # one scene per file (default export)
  lib/
    types.ts                 # Scene + SceneContext types
    plugin-handle.ts         # NotePack/Obsidian helpers
  fixture-vault/             # checked-in deterministic vault
wdio.conf.mts                # WebdriverIO config (window size, Obsidian version)
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

## Fixture vault

`screenshots/fixture-vault/` is the source of truth — checked into the repo. `wdio-obsidian-service` copies it to its own temp dir per run, so scenes can mutate freely without dirtying the committed fixture. Edits to filenames or dates should be made directly to this folder and committed.

The fixture deliberately mixes:
- Multiple team-member folders (`Team/<Name>/README.md`) for `@mention` syntax exercise
- Date-prefixed meeting notes (`Meetings/2026-05-XX <topic>.md`) so file-date relative resolution is exercised
- A mix of overdue / due-today / due-soon / undated todos

## Determinism

Date-sensitive views (overdue / due-soon urgency bands) drift over time as `today` changes — captures are not byte-identical across days. If urgency stability matters, add a clock-override helper in `lib/` and call it from affected scenes' `capture()`.

The captures are deterministic *within* a run: scenes execute sequentially in `maxInstances: 1`, the window size is forced, and the fixture is reset by the service between sessions.

## Why `wdio-obsidian-service` over alternatives

| Approach | Reliability | Complexity | Verdict |
|---|---|---|---|
| `wdio-obsidian-service` (DOM driving) | High — deterministic, pixel-perfect | Medium — one-time wdio setup | **Chosen** |
| Computer Use API | Medium — visual model, timing-sensitive | High — API loop + retry logic | Rejected |
| Claude Cowork | Medium — visual UI agent, non-deterministic | Low — but not invokable from a skill | Rejected |
