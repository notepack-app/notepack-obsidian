import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTHORED_AS_OF,
  renderFixtures,
} from "./lib/render-fixtures";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const sourceDir = path.resolve(repoRoot, "screenshots", "fixture-vault");
const outDir = path.resolve(
  repoRoot,
  "screenshots",
  ".fixture-vault-rendered",
);

function parseTodayFlag(argv: string[]): Date | undefined {
  for (const arg of argv) {
    if (arg.startsWith("--today=")) {
      const iso = arg.slice("--today=".length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        throw new Error(
          `--today must be YYYY-MM-DD, got: ${iso}`,
        );
      }
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
  }
  return undefined;
}

try {
  const today = parseTodayFlag(process.argv.slice(2));
  const result = renderFixtures({
    sourceDir,
    outDir,
    anchorDate: AUTHORED_AS_OF,
    today,
  });
  const sign = result.deltaDays >= 0 ? "+" : "";
  console.log(
    `Rendered ${result.filesWritten} files, shifted ${result.datesShifted} dates by ${sign}${result.deltaDays}d -> screenshots/.fixture-vault-rendered/`,
  );
} catch (err) {
  console.error(
    `[screenshots:render] ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
}
