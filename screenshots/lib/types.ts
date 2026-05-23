import type { browser } from "@wdio/globals";

export type Browser = typeof browser;

export interface SceneContext {
  browser: Browser;
  save: (suffix?: string) => Promise<void>;
}

export interface Scene {
  name: string;
  description?: string;
  capture: (ctx: SceneContext) => Promise<void>;
}
