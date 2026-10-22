import { describe, expect, it } from "vitest";

import {
  formatElapsedCompactSeconds,
  formatElapsedSincePreviousPrefix,
} from "@/lib/format-elapsed-compact";

describe("formatElapsedCompactSeconds", () => {
  it("formats sub-minute durations in seconds", () => {
    expect(formatElapsedCompactSeconds(0)).toBe("0s");
    expect(formatElapsedCompactSeconds(43)).toBe("43s");
    expect(formatElapsedCompactSeconds(59)).toBe("59s");
  });

  it("formats minute-level durations without hours", () => {
    expect(formatElapsedCompactSeconds(60)).toBe("1m");
    expect(formatElapsedCompactSeconds(65)).toBe("1m 5s");
    expect(formatElapsedCompactSeconds(43 * 60 + 48)).toBe("43m 48s");
    expect(formatElapsedCompactSeconds(59 * 60 + 59)).toBe("59m 59s");
  });

  it("formats hour-level durations with hours, minutes, and seconds", () => {
    expect(formatElapsedCompactSeconds(60 * 60)).toBe("1h 0m 0s");
    expect(formatElapsedCompactSeconds(3 * 60 * 60 + 5 * 60 + 28)).toBe("3h 5m 28s");
    expect(formatElapsedCompactSeconds(17 * 60 * 60 + 40 * 60 + 43)).toBe("17h 40m 43s");
  });

  it("formats multi-day durations with days, hours, minutes, and seconds", () => {
    expect(formatElapsedCompactSeconds(2 * 24 * 60 * 60 + 5 * 60 * 60 + 30 * 60 + 15)).toBe(
      "2d 5h 30m 15s",
    );
  });
});

describe("formatElapsedSincePreviousPrefix", () => {
  it("prefixes compact elapsed durations with a plus sign", () => {
    expect(formatElapsedSincePreviousPrefix(43)).toBe("+43s");
    expect(formatElapsedSincePreviousPrefix(43 * 60 + 48)).toBe("+43m 48s");
    expect(formatElapsedSincePreviousPrefix(17 * 60 * 60 + 40 * 60 + 43)).toBe("+17h 40m 43s");
  });
});
