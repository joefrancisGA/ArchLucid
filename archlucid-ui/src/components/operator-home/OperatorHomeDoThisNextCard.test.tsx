import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeDoThisNextCard } from "@/components/operator-home/OperatorHomeDoThisNextCard";
import {
  OPERATOR_HOME_DO_THIS_NEXT_HEADING,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA,
  OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
} from "@/lib/buyer-polish-copy";
import { featuredCompletedSampleReviewHref } from "@/lib/fetch-tenant-homepage-settings-client";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: vi.fn(),
}));

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: vi.fn(),
}));

import { useFeaturedCompletedSampleQuery } from "@/hooks/use-featured-completed-sample-query";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";

describe("OperatorHomeDoThisNextCard", () => {
  it("shows exactly one primary next-step control with demoted help links (TB-1038)", () => {
    vi.mocked(useFinishSetupReadinessContext).mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      readyCount: 2,
      totalCount: 2,
    });
    vi.mocked(useFeaturedCompletedSampleQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        selectedRunId: "claims-intake-modernization",
        isConfigured: true,
        isAvailable: true,
        reviewTitle: "Claims intake modernization",
        architectureName: "Claims intake modernization",
        completedUtc: "2026-01-01T00:00:00.000Z",
        isSampleApproved: true,
      },
    } as ReturnType<typeof useFeaturedCompletedSampleQuery>);

    render(<OperatorHomeDoThisNextCard />);

    expect(screen.getByRole("heading", { name: OPERATOR_HOME_DO_THIS_NEXT_HEADING })).toBeInTheDocument();

    const primary = screen.getByTestId("operator-home-do-this-next-primary");
    expect(primary).toHaveTextContent(OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA);
    expect(primary).toHaveAttribute(
      "href",
      featuredCompletedSampleReviewHref("claims-intake-modernization"),
    );

    const card = screen.getByTestId("operator-home-do-this-next");
    expect(within(card).getAllByTestId("operator-home-do-this-next-primary")).toHaveLength(1);
    expect(within(card).queryAllByRole("button")).toHaveLength(0);

    expect(screen.getByTestId("operator-home-do-this-next-learn-how")).toHaveTextContent(
      OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
    );
    expect(screen.getByTestId("operator-home-do-this-next-view-workflow")).toHaveTextContent(
      OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA,
    );
    expect(screen.getByTestId("operator-home-do-this-next-learn-how")).toHaveAttribute(
      "href",
      inAppHelpHref("core-pilot"),
    );
  });

  it("promotes admin setup when readiness blocks beginning", () => {
    vi.mocked(useFinishSetupReadinessContext).mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
      readyCount: 0,
      totalCount: 2,
    });
    vi.mocked(useFeaturedCompletedSampleQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useFeaturedCompletedSampleQuery>);

    render(<OperatorHomeDoThisNextCard />);

    expect(screen.getByTestId("operator-home-do-this-next-primary")).toHaveTextContent("Manage roles");
  });
});
