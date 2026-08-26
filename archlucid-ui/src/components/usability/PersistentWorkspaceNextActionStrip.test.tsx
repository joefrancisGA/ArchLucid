import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PersistentWorkspaceNextActionStrip } from "@/components/usability/PersistentWorkspaceNextActionStrip";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE } from "@/lib/persistent-workspace-next-action";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/lib/use-core-pilot-derived-step-status", () => ({
  useCorePilotDerivedStepStatus: () => ({
    isPending: false,
    nextStepIndex: 0,
    progress: {
      allDone: false,
      completedCount: 0,
      totalCount: CORE_PILOT_STEPS.length,
      nextStepIndex: 0,
    },
    statuses: Array.from({ length: CORE_PILOT_STEPS.length }, () => "not-started" as const),
  }),
}));

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    hasCommittedManifest: false,
    latestCommittedRunId: null,
  }),
}));

describe("PersistentWorkspaceNextActionStrip", () => {
  it("labels workspace progress and exposes all seven steps in a disclosure", () => {
    renderWithOperatorQuery(<PersistentWorkspaceNextActionStrip />);

    expect(screen.getByText(PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE)).toBeInTheDocument();
    expect(screen.getByText(`0 of ${CORE_PILOT_STEPS.length} steps complete`)).toBeInTheDocument();
    expect(screen.getByTestId("persistent-workspace-next-step-label")).toBeInTheDocument();
    expect(screen.getByTestId("persistent-workspace-first-review-step-0")).toHaveTextContent(
      CORE_PILOT_STEPS[0].title,
    );
    expect(screen.getByTestId("persistent-workspace-first-review-steps-disclosure")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open first review guide" })).toHaveAttribute(
      "href",
      "/architecture/first-review-guide",
    );
  });

  it("renders the step count and a progress meter so completion is readable at a glance", () => {
    renderWithOperatorQuery(<PersistentWorkspaceNextActionStrip />);

    const countLabel = `0 of ${CORE_PILOT_STEPS.length} steps complete`;

    expect(screen.getByTestId("persistent-workspace-progress-count")).toHaveTextContent(countLabel);

    const meter = screen.getByTestId("persistent-workspace-progress-meter");

    expect(meter).toHaveAttribute("role", "progressbar");
    expect(meter).toHaveAttribute("aria-valuenow", "0");
    expect(meter).toHaveAttribute("aria-valuetext", countLabel);
    expect(meter).toHaveAccessibleName(PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE);
  });
});
