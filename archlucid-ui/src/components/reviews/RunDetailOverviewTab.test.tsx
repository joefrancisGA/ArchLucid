import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
  it("does not render shortcut cards and uses specific action labels", () => {
    render(
      <RunDetailOverviewTab
        recommendedActions={[action]}
        proofStatusSlot={null}
        bottomLineSlot={<div data-testid="bottom-line">Bottom line</div>}
      />,
    );

    expect(screen.getByTestId("run-detail-overview-tab")).toBeInTheDocument();
    expect(screen.queryByText("Open")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review findings" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Findings" })).not.toBeInTheDocument();
    expect(screen.getByTestId("bottom-line")).toBeInTheDocument();
  });
});
