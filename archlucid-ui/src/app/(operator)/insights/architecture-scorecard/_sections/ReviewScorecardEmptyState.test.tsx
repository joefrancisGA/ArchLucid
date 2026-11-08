import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();
  const guidedWorkspace = {
    mode: "guided" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  };

  return {
    ...actual,
    useWorkspaceMode: () => guidedWorkspace,
    useWorkspaceModeOrDefault: () => guidedWorkspace,
  };
});

import { ReviewScorecardEmptyState } from "@/app/(operator)/insights/architecture-scorecard/_sections/ReviewScorecardEmptyState";
import {
  INSIGHTS_FINALIZED_REVIEW_OPEN_REVIEWS_ACTION,
  INSIGHTS_FINALIZED_REVIEW_START_REVIEW_ACTION,
} from "@/lib/insights-finalized-review-prerequisite-empty";
import {
  REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE,
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_HEADING,
  REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS,
  REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  REVIEW_SCORECARD_SAMPLE_HREF,
} from "@/lib/review-scorecard-empty-state";

describe("ReviewScorecardEmptyState", () => {
  it("renders sponsor-oriented empty copy, actions, and metric preview placeholders", () => {
    render(<ReviewScorecardEmptyState />);

    expect(screen.getByTestId("review-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_EMPTY_HEADING)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_EMPTY_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE })).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: INSIGHTS_FINALIZED_REVIEW_OPEN_REVIEWS_ACTION.label }),
    ).toHaveAttribute("href", INSIGHTS_FINALIZED_REVIEW_OPEN_REVIEWS_ACTION.href);
    expect(
      screen.getByRole("link", { name: INSIGHTS_FINALIZED_REVIEW_START_REVIEW_ACTION.label }),
    ).toHaveAttribute("href", INSIGHTS_FINALIZED_REVIEW_START_REVIEW_ACTION.href);
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_TERTIARY_CTA })).toHaveAttribute(
      "href",
      REVIEW_SCORECARD_SAMPLE_HREF,
    );

    for (const item of REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByTestId("review-scorecard-empty-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("review-scorecard-summary-row")).not.toBeInTheDocument();
  });
});
