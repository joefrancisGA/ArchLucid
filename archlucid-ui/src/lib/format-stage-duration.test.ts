import { describe, expect, it } from "vitest";

import { formatStageDurationMs } from "@/lib/format-stage-duration";

describe("formatStageDurationMs", () => {
  it("labels missing duration", () => {
    expect(formatStageDurationMs(null)).toBe("Duration not returned");
  });

  it("labels unusable duration", () => {
    expect(formatStageDurationMs(-1)).toBe("Duration not usable");
  });
});
