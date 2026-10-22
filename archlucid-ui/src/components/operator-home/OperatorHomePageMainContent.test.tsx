import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator-home/OperatorHomeCompactStartingActionsSection", () => ({
  OperatorHomeCompactStartingActionsSection: () => (
    <div data-testid="operator-home-compact-starting-actions" />
  ),
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: true,
    hasActionNeededReviews: true,
    openFindingsCount: 0,
    recentRunIds: [],
    reportWorkspaceReviews: vi.fn(),
  }),
}));

import { OperatorHomePageMainContent } from "@/components/operator-home/OperatorHomePageMainContent";

describe("OperatorHomePageMainContent", () => {
  it("places compact starting actions before recent reviews when workspace has reviews", () => {
    render(
      <OperatorHomePageMainContent
        heroSection={<div data-testid="home-hero" />}
        recentReviewsSection={<div data-testid="home-recent-reviews" />}
        sponsorRoiStrip={<div data-testid="home-roi" />}
        firstValueCallout={<div data-testid="home-first-value" />}
        examplesPlacement={<div data-testid="home-examples" />}
      />,
    );

    expect(screen.queryByTestId("home-hero")).toBeNull();
    expect(screen.getByTestId("operator-home-compact-starting-actions")).toBeInTheDocument();
    expect(screen.getByTestId("home-recent-reviews")).toBeInTheDocument();
    expect(screen.queryByTestId("home-first-value")).toBeNull();

    const compact = screen.getByTestId("operator-home-compact-starting-actions");
    const recent = screen.getByTestId("home-recent-reviews");
    const examples = screen.getByTestId("home-examples");

    expect(compact.compareDocumentPosition(recent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(recent.compareDocumentPosition(examples) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
