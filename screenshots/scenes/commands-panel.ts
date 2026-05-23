import type { Scene } from "../lib/types";
import { openFile, openCommandPaletteFiltered, settle } from "../lib/plugin-handle";

const scene: Scene = {
  name: "commands-panel",
  description: "captures NotePack commands filtered in command palette",
  async capture({ browser, save }) {
    await openFile(browser, "Personal.md");
    await openCommandPaletteFiltered(browser, "NotePack");
    await settle(browser);
    await save();
  },
};

export default scene;
