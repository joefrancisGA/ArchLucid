import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";

import { ReviewsHubSummaryRow } from "./ReviewsHubSummaryRow";

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: vi.fn(() => []),
}));

const useArchitectureDraftRegistryEntriesMock = vi.mocked(useArchitectureDraftRegistryEntries);

describe("ReviewsHubSummaryRow", () => {
  beforeEach(() => {
    useArchitectureDraftRegistryEntriesMock.mockReturnValue([]);
  });

  it("links posture counts to queues and inventory filters with scoped labels", () => {
    render(
      <ReviewsHubSummaryRow
        summary={{
          inProgress: 2,
          committed: 1,
          findings: 4,
          openRisks: 3,
          readyForGovernance: 1,
        }}
      />,
    );

    expect(screen.getByTestId("reviews-hub-summary-in-progress-value")).toHaveAttribute(
      "href",
      "/architecture/reviews?filter=Active",
    );
    expect(screen.getByTestId("reviews-hub-summary-in-progress-value")).toHaveAttribute(
      "aria-label",
      "2 active reviews",
    );
    expect(screen.getByTestId("reviews-hub-summary-committed-value")).toHaveAttribute(
      "href",
      "/architecture/reviews?filter=finalized",
    );
    expect(screen.getByTestId("reviews-hub-summary-findings-value")).toHaveAttribute(
      "href",
      "/governance/findings?filter=open",
    );
    expect(screen.getByTestId("reviews-hub-summary-open-risks-value")).toHaveAttribute(
      "href",
      "/governance/findings?filter=open",
    );
    expect(screen.getByTestId("reviews-hub-summary-awaiting-approval-value")).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
  });

  it("opens the sole ready draft instead of scrolling when only one draft is ready", () => {
    useArchitectureDraftRegistryEntriesMock.mockReturnValue([
      {
        draftId: "draft-001",
        displayName: "Payments",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
    ]);

    render(
      <ReviewsHubSummaryRow
        summary={{
          inProgress: 0,
          committed: 0,
          findings: 0,
          openRisks: 0,
          readyForGovernance: 0,
        }}
      />,
    );

    expect(screen.getByTestId("reviews-hub-summary-ready-for-review")).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-001",
    );
  });
});
