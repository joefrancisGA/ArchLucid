import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EvolutionCandidateChangeSetResponse } from "@/types/evolution";

import { ImpactPreviewSetupCard } from "./ImpactPreviewSetupCard";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe("ImpactPreviewSetupCard", () => {
  it("does not expose Simulate when controlled selection values are blank", () => {
    render(
      <ImpactPreviewSetupCard
        candidates={[
          {
            candidateChangeSetId: "candidate-1",
            createdUtc: "2026-11-11T00:00:00Z",
            derivationRuleVersion: "test-v1",
            sourcePlanId: "plan-1",
            status: "Ready",
            summary: "Reduce public exposure.",
            title: "Reduce public exposure",
          } satisfies EvolutionCandidateChangeSetResponse,
        ]}
        selectedCandidateId=""
        onSelectCandidate={vi.fn()}
        baselineOptions={[{ runId: "baseline-1", label: "Baseline review" }]}
        selectedBaselineId=""
        onSelectBaseline={vi.fn()}
        comparisonScope={{
          findings: true,
          risk: true,
          cost: true,
          governance: true,
          evidence: true,
        }}
        onToggleScope={vi.fn()}
        canSimulate
        simulateBusy={false}
        listLoading={false}
        onSimulate={vi.fn()}
        simulateComplete={false}
      />,
    );

    expect(screen.queryByTestId("impact-preview-simulate-button")).not.toBeInTheDocument();
  });
});
