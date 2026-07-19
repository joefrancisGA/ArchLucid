import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailOverviewTab } from "@/components/reviews/RunDetailOverviewTab";
import type { RunDetailWorkspaceRecommendedAction } from "@/lib/run-detail-workspace-derive";

const action: RunDetailWorkspaceRecommendedAction = {
  id: "review-findings",
  title: "Review critical findings",
  reason: "1 critical or high finding needs attention.",
  relatedFindingCount: 1,
  ownerOrRole: null,
  href: "/reviews/run-abc?reviewTab=findings",
  actionLabel: "Review findings",
};

describe("RunDetailOverviewTab", () => {
  it("renders recommended actions and overview link cards", () => {
    render(
      <RunDetailOverviewTab
        runId="run-abc"
        architectureTitle={null}
        architectureText={null}
        evidenceCount={2}
        hasSubmittedArchitecture={false}
        userAssertions={null}
        recommendedActions={[action]}
        blockingCount={0}
        governanceDecisionLabel="Not started"
        findingCount={3}
        criticalCount={1}
        highCount={0}
        hasManifest={false}
        onNavigateTab={vi.fn()}
        proofStatusSlot={null}
      />,
    );

    expect(screen.getByTestId("run-detail-overview-tab")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review findings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Findings" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open" }).length).toBeGreaterThan(0);
  });
});
