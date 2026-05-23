import type { Scene } from "../lib/types";
import { openFirstMarkdownFile, settle } from "../lib/plugin-handle";

const scene: Scene = {
  name: "mention-syntax",
  description: "captures editor view with @mention + due-date syntax",
  async capture({ browser, save }) {
    await openFirstMarkdownFile(browser);
    await settle(browser);
    await save();
  },
};

export default scene;
