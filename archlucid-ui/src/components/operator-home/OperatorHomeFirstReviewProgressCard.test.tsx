import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeFirstReviewProgressCard } from "@/components/operator-home/OperatorHomeFirstReviewProgressCard";
import { CORE_PILOT_STEP_COUNT } from "@/lib/core-pilot-steps";
import { writePilotChecklistPanelState } from "@/lib/core-pilot-checklist-storage";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    latestRunId: null,
    firstCommittedRunId: null,
    hasCommittedManifest: false,
  }),
}));

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";

describe("OperatorHomeFirstReviewProgressCard", () => {
  beforeEach(() => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);
    writePilotChecklistPanelState({
      steps: Array.from({ length: CORE_PILOT_STEP_COUNT }, () => false),
      hidden: false,
    });
  });

  it("renders consolidated progress summary and embedded checklist before first commit", () => {
    render(<OperatorHomeFirstReviewProgressCard checklistVariant="full" />);

    expect(screen.getByTestId("operator-home-first-review-progress")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-progress-tracker-summary")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    expect(screen.getByText(/First review progress — 0 of 7 steps/)).toBeInTheDocument();
  });

  it("hides after the workspace has a committed review package", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    render(<OperatorHomeFirstReviewProgressCard checklistVariant="compact" />);

    expect(screen.queryByTestId("operator-home-first-review-progress")).toBeNull();
  });
});
