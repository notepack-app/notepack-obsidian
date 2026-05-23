import type { Browser } from "./types";

export async function runCommand(browser: Browser, commandId: string): Promise<void> {
  await browser.executeObsidianCommand(commandId);
}

export async function openMyTodos(browser: Browser): Promise<void> {
  await runCommand(browser, "notepack:show-my-todos");
}

export async function openTeamTodos(browser: Browser): Promise<void> {
  await runCommand(browser, "notepack:show-team-todos");
}

export async function openRecentFiles(browser: Browser): Promise<void> {
  await runCommand(browser, "notepack:show-recent-files");
}

export async function openSettingsTab(
  browser: Browser,
  tabId: string = "notepack",
): Promise<void> {
  await browser.executeObsidian(({ app }: { app: any }, id: string) => {
    app.setting.open();
    app.setting.openTabById(id);
  }, tabId);
}

export async function openFile(browser: Browser, filePath: string): Promise<void> {
  await browser.executeObsidian(async ({ app }: { app: any }, p: string) => {
    await app.workspace.openLinkText(p, "", false);
  }, filePath);
}

export async function openFirstMarkdownFile(browser: Browser): Promise<void> {
  await browser.executeObsidian(async ({ app }: { app: any }) => {
    const files = app.vault
      .getMarkdownFiles()
      .sort((a: { path: string }, b: { path: string }) =>
        a.path.localeCompare(b.path),
      );
    const first = files[0];
    if (first) {
      await app.workspace.openLinkText(first.path, "", false);
    }
  });
}

export async function settle(browser: Browser, ms: number = 800): Promise<void> {
  await browser.pause(ms);
}

export async function closeAllModals(browser: Browser): Promise<void> {
  await browser.executeObsidian(({ app }: { app: any }) => {
    app.setting?.close?.();
    document
      .querySelectorAll(".modal-container, .modal-bg")
      .forEach((el) => (el as HTMLElement).remove());
  });
}

export async function openCommandPaletteFiltered(
  browser: Browser,
  query: string,
): Promise<void> {
  await closeAllModals(browser);
  await browser.pause(150);
  await runCommand(browser, "command-palette:open");
  await browser.execute((q: string) => {
    const input = document.querySelector(
      ".prompt .prompt-input",
    ) as HTMLInputElement | null;
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, q);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, query);
}

export async function setRightSidebarWidth(
  browser: Browser,
  px: number,
): Promise<void> {
  await browser.executeObsidian(({ app }: { app: any }, width: number) => {
    const split = app.workspace.rightSplit;
    if (!split) return;
    if (split.collapsed && typeof split.expand === "function") {
      split.expand();
    }
    if (typeof split.setSize === "function") {
      split.setSize(width);
    } else {
      const el = document.querySelector(
        ".mod-right-split, .workspace-split.mod-right",
      ) as HTMLElement | null;
      if (el) el.style.width = `${width}px`;
    }
  }, px);
}
