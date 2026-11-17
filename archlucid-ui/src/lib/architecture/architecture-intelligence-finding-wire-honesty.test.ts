import { describe, expect, it } from "vitest";

import {
  readArchitectureIntelligenceHumanReviewStoredFromWire,
  readArchitectureIntelligenceSeverityStoredFromWire,
} from "@/lib/architecture/architecture-intelligence-finding-wire-honesty";

describe("architecture-intelligence-finding-wire-honesty", () => {
  it("reads severity and human-review stored flags from finding properties", () => {
    const wireJson = JSON.stringify({
      properties: {
        "architectureIntelligence.severityStored": "False",
        "architectureIntelligence.humanReviewStatusStored": "True",
      },
    });

    expect(readArchitectureIntelligenceSeverityStoredFromWire(wireJson)).toBe(false);
    expect(readArchitectureIntelligenceHumanReviewStoredFromWire(wireJson)).toBe(true);
  });
});
