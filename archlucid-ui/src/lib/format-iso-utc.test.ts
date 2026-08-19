import { describe, expect, it } from "vitest";
import { formatIsoUtcForDisplay, parseIsoUtcMs } from "./format-iso-utc";

describe("parseIsoUtcMs", () => {
  it("treats offset-less ISO strings as UTC (SQL DateTime Unspecified round-trip)", () => {
    expect(parseIsoUtcMs("2026-08-11T21:44:05.000")).toBe(Date.parse("2026-08-11T21:44:05.000Z"));
  });

  it("preserves explicit Z and numeric offsets", () => {
    expect(parseIsoUtcMs("2026-08-11T21:44:05.000Z")).toBe(Date.parse("2026-08-11T21:44:05.000Z"));
    expect(parseIsoUtcMs("2026-08-11T17:44:05.000-04:00")).toBe(Date.parse("2026-08-11T21:44:05.000Z"));
  });

  it("returns NaN for empty or invalid input", () => {
    expect(Number.isNaN(parseIsoUtcMs(""))).toBe(true);
    expect(Number.isNaN(parseIsoUtcMs("not-a-date"))).toBe(true);
  });
});

describe("formatIsoUtcForDisplay", () => {
  it("includes UTC in the formatted label for a valid ISO string", () => {
    const s = formatIsoUtcForDisplay("2024-06-01T12:00:00.000Z");
    expect(s).toContain("UTC");
  });

  it("returns the original string when parsing fails", () => {
    expect(formatIsoUtcForDisplay("not-a-date")).toBe("not-a-date");
  });
});
