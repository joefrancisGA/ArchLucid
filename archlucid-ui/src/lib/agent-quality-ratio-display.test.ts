import { describe, expect, it } from "vitest";

import {
  agentQualityRatioOutOfRangeHint,
  formatAgentQualityRatioCell,
} from "@/lib/agent-quality-ratio-display";

describe("formatAgentQualityRatioCell", () => {
  it("labels ratios above 1 as not usable", () => {
    expect(formatAgentQualityRatioCell(1.2, "semantic", "warned")).toBe("Not usable");
  });
});

describe("agentQualityRatioOutOfRangeHint", () => {
  it("includes the raw value in the hint", () => {
    expect(agentQualityRatioOutOfRangeHint(1.2)).toContain("1.20");
  });
});
