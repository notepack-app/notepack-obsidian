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

describe("renderFixtures transform", () => {
  let tmpRoot: string;
  let source: string;
  let out: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "render-xform-"));
    source = path.join(tmpRoot, "src");
    out = path.join(tmpRoot, "out");
    fs.mkdirSync(source, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  const writeSource = (rel: string, content: string) => {
    const full = path.join(source, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  };

  const readOut = (rel: string): string =>
    fs.readFileSync(path.join(out, rel), "utf8");

  it("produces byte-identical output when delta is 0", () => {
    writeSource("Meetings/2026-05-22 Standup.md", "- due 2026-05-30\n");
    writeSource("Personal.md", "- due 2026-05-27\n");

    const result = renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 23)),
    });

    expect(result.deltaDays).toBe(0);
    expect(readOut("Meetings/2026-05-22 Standup.md")).toBe("- due 2026-05-30\n");
    expect(readOut("Personal.md")).toBe("- due 2026-05-27\n");
  });

  it("shifts filename and body dates by positive delta", () => {
    writeSource("Meetings/2026-05-22 Standup.md", "- due 2026-05-30\n");

    const result = renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 30)), // anchor + 7
    });

    expect(result.deltaDays).toBe(7);
    expect(fs.existsSync(path.join(out, "Meetings/2026-05-29 Standup.md"))).toBe(true);
    expect(readOut("Meetings/2026-05-29 Standup.md")).toBe("- due 2026-06-06\n");
  });

  it("shifts dates by negative delta", () => {
    writeSource("Meetings/2026-05-22 Standup.md", "due 2026-05-30");

    const result = renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 18)), // anchor - 5
    });

    expect(result.deltaDays).toBe(-5);
    expect(fs.existsSync(path.join(out, "Meetings/2026-05-17 Standup.md"))).toBe(true);
    expect(readOut("Meetings/2026-05-17 Standup.md")).toBe("due 2026-05-25");
  });

  it("preserves relative gap between filename date and body date", () => {
    writeSource("Meetings/2026-05-22 Sprint.md", "first 2026-05-25\nsecond 2026-06-01\n");

    renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 7, 1)), // anchor + 70
    });

    const renamed = path.join(out, "Meetings/2026-07-31 Sprint.md");
    expect(fs.existsSync(renamed)).toBe(true);
    const body = fs.readFileSync(renamed, "utf8");
    expect(body).toContain("first 2026-08-03"); // 5/25 + 70 = 8/3
    expect(body).toContain("second 2026-08-10"); // 6/1 + 70 = 8/10
  });

  it("shifts multiple dates on the same line", () => {
    writeSource("note.md", "from 2026-05-23 to 2026-05-30\n");

    renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 26)),
    });

    expect(readOut("note.md")).toBe("from 2026-05-26 to 2026-06-02\n");
  });

  it("does not match non-date digit sequences", () => {
    writeSource("note.md", "version 2026 build 12345-67-89 release 20260523\n");

    renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 30)),
    });

    expect(readOut("note.md")).toBe("version 2026 build 12345-67-89 release 20260523\n");
  });

  it("shifts dates inside YAML frontmatter", () => {
    writeSource(
      "note.md",
      "---\ncreated: 2026-05-20\n---\n# Note\n- due 2026-05-25\n",
    );

    renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 26)),
    });

    expect(readOut("note.md")).toBe(
      "---\ncreated: 2026-05-23\n---\n# Note\n- due 2026-05-28\n",
    );
  });

  it("wipes stale files from outDir before render", () => {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "stale.md"), "old", "utf8");
    writeSource("kept.md", "ok\n");

    renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 23)),
    });

    expect(fs.existsSync(path.join(out, "stale.md"))).toBe(false);
    expect(fs.existsSync(path.join(out, "kept.md"))).toBe(true);
  });

  it("returns correct filesWritten and datesShifted counts", () => {
    writeSource("a.md", "x 2026-05-25 y\n");
    writeSource("Meetings/2026-05-20 b.md", "z 2026-05-22\n");

    const result = renderFixtures({
      sourceDir: source,
      outDir: out,
      anchorDate: "2026-05-23",
      today: new Date(Date.UTC(2026, 4, 25)),
    });

    expect(result.filesWritten).toBe(2);
    // a.md body: 1; b.md filename: 1, body: 1 => 3 total
    expect(result.datesShifted).toBe(3);
    expect(result.deltaDays).toBe(2);
  });
});
