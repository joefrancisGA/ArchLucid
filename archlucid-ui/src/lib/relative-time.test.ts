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
});
