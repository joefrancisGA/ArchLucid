import { describe, expect, it } from "vitest";

import { formatProcessUptime } from "@/lib/format-process-uptime";

describe("formatProcessUptime", () => {
  it("formats sub-minute uptime", () => {
    expect(formatProcessUptime(45)).toBe("45s");
  });

  it("formats hours and minutes", () => {
    expect(formatProcessUptime(3661)).toBe("1h 1m");
  });

  it("returns em dash for invalid input", () => {
    expect(formatProcessUptime(null)).toBe("—");
  });
});
