import { shiftIsoDate } from "../render-fixtures";

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
