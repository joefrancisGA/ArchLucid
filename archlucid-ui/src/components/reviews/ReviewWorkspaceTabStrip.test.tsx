import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { resolveReviewDetailVisibleTabs } from "@/lib/resolve-review-detail-visible-tabs";
import { REVIEW_DETAIL_TAB_LABELS, type ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

describe("ReviewWorkspaceTabStrip", () => {
  it("renders primary tabs plus mobile and desktop More sections affordances", () => {
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

    expect(screen.getByTestId("review-detail-workspace-sections-select")).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-workspace-more-tabs")).toBeInTheDocument();
    expect(screen.queryByTestId(`review-detail-workspace-tab-${resolved.moreTabIds[0]}`)).not.toBeInTheDocument();
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

  it("switches tabs from the More sections menu", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: false,
      runCompleted: false,
    });
    const onTabChange = vi.fn();
    const moreTab = resolved.moreTabIds[0];

    render(
      <ReviewWorkspaceTabStrip
        lifecycle="finalized"
        activeTab="overview"
        resolvedTabs={resolved}
        onTabChange={onTabChange}
      />,
    );

    fireEvent.click(screen.getByTestId("review-detail-workspace-more-tabs"));
    fireEvent.click(screen.getByTestId(`review-detail-workspace-more-tab-${moreTab}`));

    expect(onTabChange).toHaveBeenCalledWith(moreTab);
  });

  it("switches tabs from the mobile section picker", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: false,
      runCompleted: false,
    });
    const onTabChange = vi.fn();
    const moreTab = resolved.moreTabIds[0];

    render(
      <ReviewWorkspaceTabStrip
        lifecycle="finalized"
        activeTab="overview"
        resolvedTabs={resolved}
        onTabChange={onTabChange}
      />,
    );

    fireEvent.change(screen.getByTestId("review-detail-workspace-sections-select"), {
      target: { value: moreTab },
    });

    expect(onTabChange).toHaveBeenCalledWith(moreTab);
  });
});
