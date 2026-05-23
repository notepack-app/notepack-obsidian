import * as path from "node:path";
import { env } from "node:process";
import { parseObsidianVersions } from "wdio-obsidian-service";

const cacheDir = path.resolve(".obsidian-cache");

const versions = await parseObsidianVersions(
  env.OBSIDIAN_VERSIONS ?? "latest/latest",
  { cacheDir },
);

export const config: WebdriverIO.Config = {
  runner: "local",
  framework: "mocha",
  specs: ["./screenshots/all.e2e.ts"],
  maxInstances: 1,
  capabilities: versions.map<WebdriverIO.Capabilities>(
    ([appVersion, installerVersion]) => ({
      browserName: "obsidian",
      "wdio:obsidianOptions": {
        appVersion,
        installerVersion,
        plugins: ["."],
        vault: "screenshots/fixture-vault",
      },
      "goog:chromeOptions": {
        args: ["--window-size=1440,900", "--force-device-scale-factor=1"],
      },
    }),
  ),
  services: ["obsidian"],
  reporters: ["obsidian"],
  mochaOpts: {
    ui: "bdd",
    timeout: 120 * 1000,
  },
  waitforInterval: 250,
  waitforTimeout: 10 * 1000,
  logLevel: "warn",
  cacheDir,
  injectGlobals: false,
};
