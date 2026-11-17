import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkbenchFindingSelectionSync } from "@/components/reviews/WorkbenchFindingSelectionSync";

const scheduleScrollToReviewFindingMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/review-detail-section-scroll", () => ({
  scheduleScrollToReviewFinding: scheduleScrollToReviewFindingMock,
}));

vi.mock("@/lib/review-detail-workspace-tabs", () => ({
  writeReviewDetailFindingIdToUrl: vi.fn(),
}));

vi.mock("@/components/reviews/ReviewWorkbenchSelectionContext", () => ({
  useReviewWorkbenchSelection: () => ({
    selectedFindingId: "finding-queue-1",
    reconcileSelectedFindingId: vi.fn(),
  }),
}));

describe("WorkbenchFindingSelectionSync", () => {
  it("schedules finding scroll when the selected finding card is in the DOM", () => {
    scheduleScrollToReviewFindingMock.mockClear();

    const card = document.createElement("article");
    card.setAttribute("data-finding-id", "finding-queue-1");
    document.body.appendChild(card);

    render(<WorkbenchFindingSelectionSync />);

    expect(scheduleScrollToReviewFindingMock).toHaveBeenCalledWith("finding-queue-1");

    document.body.innerHTML = "";
  });
});
