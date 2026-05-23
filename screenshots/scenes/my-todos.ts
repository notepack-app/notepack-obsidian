import type { Scene } from "../lib/types";
import { openFile, openMyTodos, settle } from "../lib/plugin-handle";

const scene: Scene = {
  name: "my-todos",
  description: "captures My todos sidebar view with Personal.md open",
  async capture({ browser, save }) {
    await openFile(browser, "Personal.md");
    await openMyTodos(browser);
    await settle(browser);
    await save();
  },
};

export default scene;
