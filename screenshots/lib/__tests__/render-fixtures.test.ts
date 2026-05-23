import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  AUTHORED_AS_OF,
  renderFixtures,
  shiftIsoDate,
} from "../render-fixtures";

describe("shiftIsoDate", () => {
  it("returns the same date when delta is 0", () => {
    expect(shiftIsoDate("2026-05-23", 0)).toBe("2026-05-23");
  });

  it("shifts forward by N days", () => {
    expect(shiftIsoDate("2026-05-23", 10)).toBe("2026-06-02");
  });

  it("shifts backward by N days", () => {
    expect(shiftIsoDate("2026-05-23", -5)).toBe("2026-05-18");
  });

  it("crosses year boundaries forward", () => {
    expect(shiftIsoDate("2026-12-30", 10)).toBe("2027-01-09");
  });

  it("crosses year boundaries backward", () => {
    expect(shiftIsoDate("2026-01-05", -10)).toBe("2025-12-26");
  });

  it("handles leap year Feb 28 -> Feb 29 (2024)", () => {
    expect(shiftIsoDate("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("handles leap year Feb 29 -> Mar 1 (2024)", () => {
    expect(shiftIsoDate("2024-02-29", 1)).toBe("2024-03-01");
  });

  it("handles non-leap year Feb 28 -> Mar 1 (2025)", () => {
    expect(shiftIsoDate("2025-02-28", 1)).toBe("2025-03-01");
  });

  it("throws on malformed input", () => {
    expect(() => shiftIsoDate("not-a-date", 0)).toThrow();
    expect(() => shiftIsoDate("2026-13-01", 0)).toThrow();
    expect(() => shiftIsoDate("2026-02-30", 0)).toThrow();
  });
});

describe("AUTHORED_AS_OF", () => {
  it("is a valid ISO date string", () => {
    expect(AUTHORED_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(() => shiftIsoDate(AUTHORED_AS_OF, 0)).not.toThrow();
  });
});

describe("renderFixtures validation", () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "render-fixtures-"));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("throws when anchorDate is malformed", () => {
    const source = path.join(tmpRoot, "src");
    const out = path.join(tmpRoot, "out");
    fs.mkdirSync(source);
    expect(() =>
      renderFixtures({
        sourceDir: source,
        outDir: out,
        anchorDate: "2026/05/23",
      }),
    ).toThrow(/ISO date/i);
  });

  it("throws when today override is malformed", () => {
    const source = path.join(tmpRoot, "src");
    const out = path.join(tmpRoot, "out");
    fs.mkdirSync(source);
    expect(() =>
      renderFixtures({
        sourceDir: source,
        outDir: out,
        anchorDate: "2026-05-23",
        today: new Date("not-a-date"),
      }),
    ).toThrow(/today/i);
  });

  it("throws when outDir is nested under sourceDir", () => {
    const source = path.join(tmpRoot, "src");
    const out = path.join(source, "nested");
    fs.mkdirSync(source);
    expect(() =>
      renderFixtures({
        sourceDir: source,
        outDir: out,
        anchorDate: "2026-05-23",
      }),
    ).toThrow(/outDir/i);
  });

  it("throws when outDir equals sourceDir", () => {
    const source = path.join(tmpRoot, "src");
    fs.mkdirSync(source);
    expect(() =>
      renderFixtures({
        sourceDir: source,
        outDir: source,
        anchorDate: "2026-05-23",
      }),
    ).toThrow(/outDir/i);
  });
});
