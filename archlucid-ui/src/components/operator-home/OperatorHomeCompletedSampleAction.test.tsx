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

const resolveOperatorHomeCompletedSampleFallback = vi.fn(() => null);

vi.mock("@/lib/resolve-operator-home-completed-sample-fallback", () => ({
  resolveOperatorHomeCompletedSampleFallback: () => resolveOperatorHomeCompletedSampleFallback(),
}));

import { OperatorHomeCompletedSampleAction } from "@/components/operator-home/OperatorHomeCompletedSampleAction";
import {
  OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA,
  OPERATOR_HOME_COMPLETED_SAMPLE_FETCH_ERROR_MESSAGE,
  OPERATOR_HOME_CONTACT_WORKSPACE_OWNER_HINT,
  OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

describe("OperatorHomeCompletedSampleAction", () => {
  beforeEach(() => {
    useNavCallerAuthorityRank.mockReturnValue(3);
    resolveOperatorHomeCompletedSampleFallback.mockReturnValue(null);
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

  it("opens the curated showcase fallback when no workspace sample is configured", () => {
    resolveOperatorHomeCompletedSampleFallback.mockReturnValue({
      href: "/architecture/reviews/customer-intake-modernization",
      label: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
    });
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

    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/customer-intake-modernization",
    );
    expect(screen.queryByText(OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE)).toBeNull();
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

  it("shows fetch error copy when the featured sample query fails", () => {
    useFeaturedCompletedSampleQuery.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    });

    render(<OperatorHomeCompletedSampleAction />);

    expect(screen.getByTestId("operator-home-completed-sample-fetch-error")).toHaveTextContent(
      OPERATOR_HOME_COMPLETED_SAMPLE_FETCH_ERROR_MESSAGE,
    );
  });
});