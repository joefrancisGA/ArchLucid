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
  href: "/architecture/reviews/run-abc?reviewTab=findings",
  actionLabel: "Review findings",
};

describe("RunDetailOverviewTab", () => {
  it("keeps overview compact without duplicating sticky recommended actions", () => {
    render(
      <RunDetailOverviewTab
        runId="run-abc"
        architectureTitle={null}
        architectureText={null}
        evidenceCount={2}
        hasSubmittedArchitecture={false}
        userAssertions={null}
        recommendedActions={[action]}
        criticalCount={1}
        highCount={0}
        onNavigateTab={vi.fn()}
        proofStatusSlot={<div data-testid="proof-status-slot" />}
      />,
    );

    expect(screen.getByTestId("run-detail-overview-tab")).toBeInTheDocument();
    expect(screen.getByTestId("proof-status-slot")).toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-recommended-actions")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review findings" })).not.toBeInTheDocument();
  });
});
