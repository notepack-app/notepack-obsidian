import * as fs from "node:fs";
import * as path from "node:path";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_GLOBAL_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const AUTHORED_AS_OF = "2026-05-23";

export type RenderOptions = {
  sourceDir: string;
  outDir: string;
  anchorDate: string;
  today?: Date;
};

export type RenderResult = {
  filesWritten: number;
  datesShifted: number;
  deltaDays: number;
};

function parseIsoDateUtc(iso: string): number {
  const match = ISO_DATE_RE.exec(iso);
  if (!match) {
    throw new Error(`Malformed ISO date: ${iso}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const round = new Date(ms);
  if (
    round.getUTCFullYear() !== year ||
    round.getUTCMonth() !== month - 1 ||
    round.getUTCDate() !== day
  ) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return ms;
}

function formatIsoDateUtc(ms: number): string {
  const d = new Date(ms);
  const y = String(d.getUTCFullYear()).padStart(4, "0");
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftIsoDate(iso: string, deltaDays: number): string {
  const ms = parseIsoDateUtc(iso);
  return formatIsoDateUtc(ms + deltaDays * MS_PER_DAY);
}

function shiftDatesInString(
  input: string,
  deltaDays: number,
): { output: string; count: number } {
  let count = 0;
  const output = input.replace(ISO_DATE_GLOBAL_RE, (match) => {
    count += 1;
    return shiftIsoDate(match, deltaDays);
  });
  return { output, count };
}

function validateOptions(opts: RenderOptions): {
  todayMs: number;
  anchorMs: number;
  sourceResolved: string;
  outResolved: string;
} {
  const anchorMs = parseIsoDateUtc(opts.anchorDate);

  const today = opts.today ?? new Date();
  if (Number.isNaN(today.getTime())) {
    throw new Error(`Invalid today date provided`);
  }
  const todayIso = `${String(today.getUTCFullYear()).padStart(4, "0")}-${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  const todayMs = parseIsoDateUtc(todayIso);

  const sourceResolved = path.resolve(opts.sourceDir);
  const outResolved = path.resolve(opts.outDir);
  if (outResolved === sourceResolved) {
    throw new Error(`outDir must not equal sourceDir`);
  }
  const rel = path.relative(sourceResolved, outResolved);
  if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
    throw new Error(`outDir must not be nested under sourceDir`);
  }

  return { todayMs, anchorMs, sourceResolved, outResolved };
}

export function renderFixtures(opts: RenderOptions): RenderResult {
  const { todayMs, anchorMs, sourceResolved, outResolved } =
    validateOptions(opts);
  const deltaDays = Math.round((todayMs - anchorMs) / MS_PER_DAY);

  fs.rmSync(outResolved, { recursive: true, force: true });
  fs.mkdirSync(outResolved, { recursive: true });

  let filesWritten = 0;
  let datesShifted = 0;

  const walk = (relSrcDir: string, relOutDir: string): void => {
    const absDir = path.join(sourceResolved, relSrcDir);
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcRel = path.join(relSrcDir, entry.name);
      const shiftedName = shiftDatesInString(entry.name, deltaDays);
      datesShifted += shiftedName.count;
      const outRel = path.join(relOutDir, shiftedName.output);
      const outAbs = path.join(outResolved, outRel);

      if (entry.isDirectory()) {
        fs.mkdirSync(outAbs, { recursive: true });
        walk(srcRel, outRel);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const srcAbs = path.join(sourceResolved, srcRel);
      const text = fs.readFileSync(srcAbs, "utf8");
      const shifted = shiftDatesInString(text, deltaDays);
      datesShifted += shifted.count;

      fs.mkdirSync(path.dirname(outAbs), { recursive: true });
      fs.writeFileSync(outAbs, shifted.output, "utf8");
      filesWritten += 1;
    }
  };

  walk("", "");

  return { filesWritten, datesShifted, deltaDays };
}
