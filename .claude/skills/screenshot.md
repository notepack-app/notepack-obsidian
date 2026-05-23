---
name: screenshot
description: Regenerate NotePack docs screenshots via the wdio-obsidian-service harness. Use when the user asks to refresh README/docs visuals after a UI change, regenerate screenshots, or invokes /screenshot.
---

# screenshot

Regenerate NotePack docs screenshots.

## What to do when invoked

1. **Build the plugin.** `pnpm run build` — confirms `main.js` and `styles.css` are at the repo root for side-load.
2. **Capture.** `pnpm screenshots`. Writes PNGs to `docs/screenshots/<scene-name>.png`. First run downloads Obsidian into `.obsidian-cache/` (cached for future runs).
3. **Report.** List the PNGs written. On scene failure, surface the wdio output and stop — do not retry blindly.

## Adding or modifying scenes

See `screenshots/README.md` for the full scene contract, helper inventory, configuration, and architecture. Skim it before adding a scene, changing window size, or touching the fixture vault.

## Do not

- Do not auto-commit captured PNGs or fixture content. Ask the user to review first.
- Do not bypass `pnpm run build`; an out-of-date `main.js` will side-load stale plugin code.
