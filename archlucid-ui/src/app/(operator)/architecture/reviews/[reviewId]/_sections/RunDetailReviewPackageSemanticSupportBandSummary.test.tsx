import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailReviewPackageSemanticSupportBandSummary } from "./RunDetailReviewPackageSemanticSupportBandSummary";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

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

describe("RunDetailReviewPackageSemanticSupportBandSummary (AS-062)", () => {
  it("shows Working stamp counts and lists unsupported findings", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <RunDetailReviewPackageSemanticSupportBandSummary
        findings={[
          sampleFinding({ findingId: "f-1", semanticSupportBand: "Supported" }),
          sampleFinding({ findingId: "f-2", semanticSupportBand: "Unchecked" }),
          sampleFinding({
            findingId: "f-3",
            title: "Unsupported claim",
            semanticSupportBand: "Unsupported",
          }),
        ]}
      />,
    );

    expect(screen.getByTestId("run-detail-stamp-semantic-support-band-summary")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-stamp-semantic-support-band-line")).toHaveTextContent(
      "Semantic support (decision-grade): 1 Supported · 1 Unchecked · 1 Unsupported",
    );
    expect(screen.queryByTestId("run-detail-stamp-semantic-support-all-clear")).toBeNull();
    expect(screen.getByTestId("run-detail-stamp-semantic-support-unsupported-list")).toHaveTextContent(
      "f-3: Unsupported claim",
    );
  });

  it("shows all-clear honesty when no unsupported decision-grade findings remain", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <RunDetailReviewPackageSemanticSupportBandSummary
        findings={[sampleFinding({ semanticSupportBand: "Supported" })]}
      />,
    );

    expect(screen.getByTestId("run-detail-stamp-semantic-support-all-clear")).toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-stamp-semantic-support-unsupported-list")).toBeNull();
  });

  it("uses compact Guided eval line", () => {
    workspaceModeMock.isWorkingMode = false;

    render(
      <RunDetailReviewPackageSemanticSupportBandSummary
        findings={[sampleFinding({ semanticSupportBand: "Supported" })]}
      />,
    );

    expect(screen.getByTestId("run-detail-stamp-semantic-support-band-line")).toHaveTextContent(
      "Semantic support: 1 Supported",
    );
  });
});
