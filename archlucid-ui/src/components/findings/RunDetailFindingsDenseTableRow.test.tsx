import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailFindingsDenseTableRow } from "@/components/findings/RunDetailFindingsDenseTableRow";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";
import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working" }),
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
    confidenceLevel: "High",
    insightDensityScore: 88,
    classification: FINDING_CLASSIFICATION_DECISION_GRADE,
    ...overrides,
  };
}

describe("RunDetailFindingsDenseTableRow", () => {
  it("shows typed-engine honesty beside decision-grade classification in Working mode (FC-22)", () => {
    render(
      <table>
        <tbody>
          <RunDetailFindingsDenseTableRow runId="run-1" finding={sampleFinding()} showDensityScore />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId("finding-classification-chip-finding-1")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-findings-density-honesty-finding-1")).toHaveTextContent(
      INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE,
    );
  });

  it("omits typed-engine honesty for checklist coverage rows", () => {
    render(
      <table>
        <tbody>
          <RunDetailFindingsDenseTableRow
            runId="run-1"
            finding={sampleFinding({ classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE })}
            showDensityScore
          />
        </tbody>
      </table>,
    );

    expect(screen.queryByTestId("run-detail-findings-density-honesty-finding-1")).toBeNull();
  });
});
