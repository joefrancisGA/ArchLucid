import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { resolveReviewDetailVisibleTabs } from "@/lib/resolve-review-detail-visible-tabs";
import { REVIEW_DETAIL_TAB_LABELS, type ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

describe("ReviewWorkspaceTabStrip", () => {
  it("renders primary and secondary tab groups with a divider on desktop", () => {
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

    expect(resolved.moreTabIds.length).toBeGreaterThan(0);
    expect(screen.getByTestId("review-detail-workspace-tab-divider")).toBeInTheDocument();
  });

  it("renders all workspace tabs in the desktop strip and a mobile section picker", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });
    const onTabChange = vi.fn();
    const allTabIds = [...resolved.visibleTabIds, ...resolved.moreTabIds];

    render(
      <ReviewWorkspaceTabStrip
        lifecycle="finalized"
        activeTab="activity"
        resolvedTabs={resolved}
        onTabChange={onTabChange}
      />,
    );

    for (const tabId of allTabIds) {
      expect(screen.getByTestId(`review-detail-workspace-tab-${tabId}`)).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: new RegExp(REVIEW_DETAIL_TAB_LABELS[tabId], "i") })).toBeInTheDocument();
    }

    expect(screen.getByText("Review section")).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-workspace-sections-select")).toBeInTheDocument();
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
