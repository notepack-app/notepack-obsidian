import type { Scene } from "../lib/types";
import { openSettingsTab, settle } from "../lib/plugin-handle";

const scene: Scene = {
  name: "settings-panel",
  description: "captures NotePack settings tab",
  async capture({ browser, save }) {
    await openSettingsTab(browser);
    await settle(browser);
    await save();
  },
};

export default scene;
