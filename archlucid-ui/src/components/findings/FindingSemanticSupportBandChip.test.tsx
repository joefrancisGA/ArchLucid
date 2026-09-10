import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingSemanticSupportBandChip } from "@/components/findings/FindingSemanticSupportBandChip";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";
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

    expect(screen.getByTestId("working-finding-semantic-support-band")).toBeInTheDocument();
    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent("Supported");
  });

  it("renders Not yet scored when wire band is Unchecked", () => {
    render(
      <FindingSemanticSupportBandChip
        finding={sampleFinding({ semanticSupportBand: "Unchecked" })}
      />,
    );

    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent("Not yet scored");
  });

  it("renders Unsupported when wire band is Unsupported", () => {
    render(
      <FindingSemanticSupportBandChip
        finding={sampleFinding({ semanticSupportBand: "Unsupported" })}
      />,
    );

    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent("Unsupported");
  });

  it("shows rehearsal label on Simulator instead of Supported", () => {
    render(
      <FindingSemanticSupportBandChip
        finding={sampleFinding({ semanticSupportBand: "Supported" })}
        structuralExecutionMode={StructuralExecutionModeWire.Simulator}
      />,
    );

    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent(
      "Rehearsal — not career support",
    );
    expect(screen.getByTestId("working-finding-semantic-support-band")).toHaveAttribute(
      "data-finding-semantic-support-band-rehearsal",
      "true",
    );
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

    expect(screen.queryByTestId("working-finding-semantic-support-band")).toBeNull();
  });
});
