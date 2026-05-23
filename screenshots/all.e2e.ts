import { browser } from "@wdio/globals";
import { before, describe, it } from "mocha";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Scene } from "./lib/types";
import { setRightSidebarWidth } from "./lib/plugin-handle";
import myTodos from "./scenes/my-todos";
import teamTodos from "./scenes/team-todos";
import mentionSyntax from "./scenes/mention-syntax";
import settingsPanel from "./scenes/settings-panel";
import commandsPanel from "./scenes/commands-panel";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "docs", "screenshots");

fs.mkdirSync(outDir, { recursive: true });

const WINDOW_WIDTH = Number(process.env.SCREENSHOT_WIDTH ?? 1440);
const WINDOW_HEIGHT = Number(process.env.SCREENSHOT_HEIGHT ?? 900);
const RIGHT_SIDEBAR_WIDTH = Number(process.env.SCREENSHOT_RIGHT_SIDEBAR ?? 440);

const scenes: Scene[] = [
  myTodos,
  teamTodos,
  mentionSyntax,
  settingsPanel,
  commandsPanel,
];

describe("NotePack screenshots", function () {
  before(async function () {
    await browser.execute(
      (w: number, h: number) => {
        const win = (window as any).electron?.remote?.getCurrentWindow?.();
        if (win) win.setSize(w, h);
      },
      WINDOW_WIDTH,
      WINDOW_HEIGHT,
    );
    await browser.pause(400);
  });

  for (const scene of scenes) {
    it(scene.description ?? scene.name, async function () {
      await scene.capture({
        browser,
        save: async (suffix?: string) => {
          await setRightSidebarWidth(browser, RIGHT_SIDEBAR_WIDTH);
          await browser.pause(150);
          const file = path.join(
            outDir,
            `${scene.name}${suffix ? `-${suffix}` : ""}.png`,
          );
          await browser.saveScreenshot(file);
        },
      });
    });
  }
});
