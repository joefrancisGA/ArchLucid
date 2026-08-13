import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "@/lib/relative-time";

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
});
