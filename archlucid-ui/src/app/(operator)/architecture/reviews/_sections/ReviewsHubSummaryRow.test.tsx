import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewsHubSummaryRow } from "./ReviewsHubSummaryRow";

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
}));

describe("ReviewsHubSummaryRow", () => {
  it("links posture counts to queues and inventory filters", () => {
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

    expect(screen.getByRole("link", { name: /2 Active/ })).toHaveAttribute(
      "href",
      "/architecture/reviews?filter=Active",
    );
    expect(screen.getByRole("link", { name: /1 Finalized/ })).toHaveAttribute(
      "href",
      "/architecture/reviews?filter=finalized",
    );
    expect(screen.getByRole("link", { name: /4 Findings/ })).toHaveAttribute("href", "/governance/findings");
    expect(screen.getByRole("link", { name: /3 Open risks/ })).toHaveAttribute(
      "href",
      "/governance/findings?filter=open",
    );
    expect(screen.getByRole("link", { name: /1 Awaiting approval/ })).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
  });
});
