import { describe, expect, it } from "vitest";

import {
  formatRelativeTime,
  formatUpdatedAbsoluteWithRelative,
  formatUpdatedRelativeWithAbsoluteParenthetical,
  isLocaleRelativeNowIso,
} from "@/lib/relative-time";

describe("formatRelativeTime", () => {
  it("formats past times relative to now", () => {
    const now = Date.parse("2026-06-01T12:00:00.000Z");
    const past = "2026-06-01T11:00:00.000Z";

    const s = formatRelativeTime(past, now);

    expect(s.length).toBeGreaterThan(0);
    expect(s.toLowerCase()).toContain("hour");
  });

  it("treats offset-less UTC wall-clock as past, not future local time", () => {
    // EDT (UTC-4): Date.parse without Z would read 17:44 as local → 4h ahead of true UTC now.
    const now = Date.parse("2026-08-11T17:44:05.000Z");
    const storedWithoutZ = "2026-08-11T17:44:05.000";

    const s = formatRelativeTime(storedWithoutZ, now);

    expect(s.toLowerCase()).not.toContain("in ");
    expect(s.toLowerCase()).toMatch(/second|now|ago/);
  });

  it("formatUpdatedRelativeWithAbsoluteParenthetical drops locale now when absolute is shown", () => {
    const now = Date.now();
    const iso = new Date(now).toISOString();

    expect(isLocaleRelativeNowIso(iso, now)).toBe(true);
    expect(formatUpdatedRelativeWithAbsoluteParenthetical(iso, "Jul 9, 2026, 8:00 PM")).toBe(
      "Updated Jul 9, 2026, 8:00 PM",
    );
    expect(formatUpdatedRelativeWithAbsoluteParenthetical(iso, "Jul 9, 2026, 8:00 PM").toLowerCase()).not.toMatch(
      /\bnow\b/,
    );
  });

  it("formatUpdatedAbsoluteWithRelative drops locale now when absolute is shown", () => {
    const now = Date.now();
    const iso = new Date(now).toISOString();

    expect(formatUpdatedAbsoluteWithRelative(iso, "Jul 9, 2026")).toBe("Updated Jul 9, 2026");
    expect(formatUpdatedAbsoluteWithRelative(iso, "Jul 9, 2026").toLowerCase()).not.toMatch(/\bnow\b/);
  });
});
