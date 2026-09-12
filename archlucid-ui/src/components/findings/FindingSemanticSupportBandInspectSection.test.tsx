import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingSemanticSupportBandInspectSection } from "@/components/findings/FindingSemanticSupportBandInspectSection";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";

const decisionGradeFinding = {
  findingId: "f-1",
  title: "Gateway posture",
  recommendation: "Claim text",
  severityValue: 3,
  findingOrder: 1,
  aiReasoning: { wireJson: "{}", reasoningTrace: "" },
  isMuted: false,
  muteReason: null,
  enforcementTier: "PolicyViolation" as const,
  classification: FINDING_CLASSIFICATION_DECISION_GRADE,
  semanticSupportBand: "Unsupported" as const,
};

describe("FindingSemanticSupportBandInspectSection (AS-070)", () => {
  it("shows claim vs restatement honesty lines when trail-backed restatement exists", () => {
    render(
      <FindingSemanticSupportBandInspectSection
        finding={decisionGradeFinding}
        trailBackedArchitectRestatement="We will tell the ARB that replication lag is accepted."
      />,
    );

    expect(screen.getByTestId("finding-architect-restatement-semantic-support-band-honesty")).toBeTruthy();
    expect(screen.getByText(/not scored as Supported/i)).toBeTruthy();
    expect(screen.getByText(/Claim band/i)).toBeTruthy();
  });

  it("omits restatement honesty line when no trail-backed restatement", () => {
    render(<FindingSemanticSupportBandInspectSection finding={decisionGradeFinding} />);

    expect(screen.queryByTestId("finding-architect-restatement-semantic-support-band-honesty")).toBeNull();
  });

  it("shows showReason honesty under the semantic support chip", () => {
    render(<FindingSemanticSupportBandInspectSection finding={decisionGradeFinding} />);

    const chip = screen.getByTestId("working-finding-semantic-support-band");

    expect(chip).toBeInTheDocument();
    expect(within(chip).getByText(/Citations do not support this claim/i)).toBeInTheDocument();
  });
});
