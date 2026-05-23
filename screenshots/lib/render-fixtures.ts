import * as fs from "node:fs";
import * as path from "node:path";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
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
  // Walk + transform implemented in Task 5.
  // For now: just validate so the validation tests pass.
  // Intentionally suppress unused destructuring; `fs` will be used in Task 5.
  void fs;
  validateOptions(opts);
  return { filesWritten: 0, datesShifted: 0, deltaDays: 0 };
}
