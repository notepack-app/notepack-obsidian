import type { Scene } from "../lib/types";
import { openFile, openTeamTodos, settle } from "../lib/plugin-handle";

const scene: Scene = {
  name: "team-todos",
  description: "captures Team todos sidebar view",
  async capture({ browser, save }) {
    await openFile(browser, "Team/Marcus Lee/README.md");
    await openTeamTodos(browser);
    await settle(browser);
    await save();
  },
};

export default scene;
