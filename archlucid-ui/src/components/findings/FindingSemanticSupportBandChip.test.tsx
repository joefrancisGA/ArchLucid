import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingSemanticSupportBandChip } from "@/components/findings/FindingSemanticSupportBandChip";
import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function sampleFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Risk 1",
    recommendation: "Review",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    classification: FINDING_CLASSIFICATION_DECISION_GRADE,
    ...overrides,
  };
}

describe("FindingSemanticSupportBandChip (AS-061)", () => {
  it("renders NotScored for decision-grade rows without wire band", () => {
    render(<FindingSemanticSupportBandChip finding={sampleFinding()} />);

    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent("Not scored");
  });

  it("renders Supported when wire band is Supported", () => {
    render(
      <FindingSemanticSupportBandChip
        finding={sampleFinding({ semanticSupportBand: "Supported" })}
      />,
    );

    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent("Supported");
  });

  it("does not render Supported chip for checklist coverage rows", () => {
    render(
      <FindingSemanticSupportBandChip
        finding={sampleFinding({
          classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
          semanticSupportBand: "Supported",
        })}
      />,
    );

    expect(screen.queryByTestId("finding-semantic-support-band-finding-1")).toBeNull();
  });
});
