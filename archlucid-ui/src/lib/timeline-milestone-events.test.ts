import { describe, expect, it } from "vitest";

import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";

describe("isTimelineMilestoneEvent", () => {
  it("returns true for known milestone types (including trimmed whitespace)", () => {
    expect(isTimelineMilestoneEvent("RunCompleted")).toBe(true);
    expect(isTimelineMilestoneEvent("  RunCompleted  ")).toBe(true);
    expect(isTimelineMilestoneEvent("com.archlucid.manifest.finalized.v1")).toBe(true);
  });

  it("returns false for non-milestone pipeline types", () => {
    expect(isTimelineMilestoneEvent("RunStarted")).toBe(false);
    expect(isTimelineMilestoneEvent("")).toBe(false);
  });
});
