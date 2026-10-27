import { describe, expect, it } from "vitest";

import {
  formatFeasibilityConfidenceBand,
  formatFeasibilityEnvelopeDescription,
} from "@/lib/feasibility/format-feasibility-soft-envelope-display";

describe("format-feasibility-soft-envelope-display", () => {
  it("labels omitted confidence bounds", () => {
    expect(formatFeasibilityConfidenceBand(undefined, 80)).toBe("Confidence band was not stored.");
    expect(formatFeasibilityConfidenceBand(0, 0)).toBe("0–0");
  });

  it("labels omitted or empty envelope description", () => {
    expect(formatFeasibilityEnvelopeDescription(null)).toBe("Envelope description was not stored.");
    expect(formatFeasibilityEnvelopeDescription("  ")).toBe("Envelope description was stored empty.");
  });
});
