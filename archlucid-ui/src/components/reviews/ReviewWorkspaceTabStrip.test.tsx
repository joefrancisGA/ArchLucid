import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { resolveReviewDetailVisibleTabs } from "@/lib/resolve-review-detail-visible-tabs";
import { REVIEW_DETAIL_TAB_LABELS, type ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

describe("ReviewWorkspaceTabStrip", () => {
  it("renders all eight tabs in the primary strip without a More sections affordance", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });
    const onTabChange = vi.fn();

    render(
      <ReviewWorkspaceTabStrip
        lifecycle="finalized"
        activeTab="activity"
        resolvedTabs={resolved}
        onTabChange={onTabChange}
      />,
    );

    for (const tabId of resolved.visibleTabIds) {
      expect(screen.getByTestId(`review-detail-workspace-tab-${tabId}`)).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: new RegExp(REVIEW_DETAIL_TAB_LABELS[tabId], "i") })).toBeInTheDocument();
    }

    expect(screen.queryByText("More sections")).not.toBeInTheDocument();
    expect(screen.queryByTestId("review-detail-workspace-more-tabs")).not.toBeInTheDocument();
  });

  it("switches tabs through the primary strip", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: false,
      runCompleted: false,
    });
    const onTabChange = vi.fn();

    render(
      <ReviewWorkspaceTabStrip
        lifecycle="finalized"
        activeTab="overview"
        resolvedTabs={resolved}
        onTabChange={onTabChange}
      />,
    );

    const architectureTab = screen.getByTestId("review-detail-workspace-tab-architecture");
    fireEvent.click(architectureTab);

    expect(onTabChange).toHaveBeenCalledWith("architecture" satisfies ReviewDetailTabId);
  });
});
