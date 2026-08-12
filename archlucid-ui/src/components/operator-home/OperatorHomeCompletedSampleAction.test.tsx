import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const useNavCallerAuthorityRank = vi.fn(() => 3);
const useFeaturedCompletedSampleQuery = vi.fn();

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: useNavCallerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: useNavCallerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => useFeaturedCompletedSampleQuery(),
}));

import { OperatorHomeCompletedSampleAction } from "@/components/operator-home/OperatorHomeCompletedSampleAction";
import {
  OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA,
  OPERATOR_HOME_CONTACT_WORKSPACE_OWNER_HINT,
  OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";

describe("OperatorHomeCompletedSampleAction", () => {
  beforeEach(() => {
    useNavCallerAuthorityRank.mockReturnValue(3);
  });

  it("opens the configured featured sample when available", () => {
    useFeaturedCompletedSampleQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        selectedRunId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        isConfigured: true,
        isAvailable: true,
        reviewTitle: "Claims intake modernization",
        architectureName: "Claims intake modernization",
        completedUtc: "2026-01-01T00:00:00.000Z",
        isSampleApproved: true,
      },
    });

    render(<OperatorHomeCompletedSampleAction />);

    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/dddddddd-dddd-dddd-dddd-dddddddddddd",
    );
  });

  it("shows owner picker affordance when no sample is configured", () => {
    useFeaturedCompletedSampleQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        selectedRunId: null,
        isConfigured: false,
        isAvailable: false,
        reviewTitle: null,
        architectureName: null,
        completedUtc: null,
        isSampleApproved: false,
      },
    });

    render(<OperatorHomeCompletedSampleAction />);

    expect(screen.getByText(OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA })).toBeInTheDocument();
  });

  it("shows contact-owner hint for non-admin users when sample is missing", () => {
    useNavCallerAuthorityRank.mockReturnValue(1);
    useFeaturedCompletedSampleQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        selectedRunId: null,
        isConfigured: false,
        isAvailable: false,
        reviewTitle: null,
        architectureName: null,
        completedUtc: null,
        isSampleApproved: false,
      },
    });

    render(<OperatorHomeCompletedSampleAction />);

    expect(screen.getByText(OPERATOR_HOME_CONTACT_WORKSPACE_OWNER_HINT)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA })).toBeNull();
  });
});