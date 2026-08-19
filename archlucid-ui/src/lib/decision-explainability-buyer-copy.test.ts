import { describe, expect, it } from "vitest";

import {
  formatDecisionPipelineBuyerLabel,
  resolveRecordedDecisionConfidenceNote,
} from "@/lib/decision-explainability-buyer-copy";

describe("decision-explainability-buyer-copy", () => {
  it("maps pipeline slugs to buyer labels", () => {
    expect(formatDecisionPipelineBuyerLabel("authority_rule_v3")).toBe("Authority rules");
    expect(formatDecisionPipelineBuyerLabel("coordinator_v2_merge")).toBe("Coordinator merge");
  });

  it("explains low-confidence accepted decisions", () => {
    expect(
      resolveRecordedDecisionConfidenceNote({
        selectedOption: "Accepted",
        confidence: 0.18,
        buyerConfidenceSource: null,
      }),
    ).toBe("Recorded disposition overrides lower pipeline confidence.");
  });
});
