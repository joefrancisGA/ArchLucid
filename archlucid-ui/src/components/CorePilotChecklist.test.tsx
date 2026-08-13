import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";
import type { CorePilotStepDerivedStatus } from "@/lib/core-pilot-step-status";

const emptyStatuses: readonly CorePilotStepDerivedStatus[] = [
  "not-started",
  "not-started",
  "not-started",
  "not-started",
  "not-started",
  "not-started",
  "not-started",
];

const mockDerivedState = {
  isPending: false,
  statuses: emptyStatuses,
  progress: {
    completedCount: 0,
    totalCount: 7,
    nextStepIndex: 0,
    allDone: false,
  },
  nextStepIndex: 0,
};

vi.mock("@/lib/use-core-pilot-derived-step-status", () => ({
  useCorePilotDerivedStepStatus: () => mockDerivedState,
}));

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    hasCommittedManifest: false,
    latestCommittedRunId: null,
  }),
}));

describe("CorePilotChecklist", () => {
  afterEach(() => {
    localStorage.clear();
    mockDerivedState.statuses = [...emptyStatuses];
    mockDerivedState.progress = {
      completedCount: 0,
      totalCount: 7,
      nextStepIndex: 0,
      allDone: false,
    };
    mockDerivedState.nextStepIndex = 0;
  });

  it("renders derived status tags instead of manual checkboxes", async () => {
    localStorage.setItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.reviewWorkflowChecklist, "0");

    render(<CorePilotChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });

    for (const step of CORE_PILOT_STEPS) {
      expect(screen.getByRole("link", { name: step.title })).toBeInTheDocument();
    }

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Status: Not started/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("core-pilot-checklist-next-step")).toBeInTheDocument();
  });

  it("shows completion banner when required steps are derived complete", async () => {
    mockDerivedState.statuses = ["done", "done", "done", "not-started", "not-started", "not-started", "done"];
    mockDerivedState.progress = {
      completedCount: 4,
      totalCount: 7,
      nextStepIndex: 3,
      allDone: true,
    };
    mockDerivedState.nextStepIndex = 3;

    localStorage.setItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.reviewWorkflowChecklist, "0");

    render(<CorePilotChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist-complete")).toBeInTheDocument();
    });
  });

  it("persists optional-step skip without checkboxes", async () => {
    localStorage.setItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.reviewWorkflowChecklist, "0");

    render(<CorePilotChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Skip for now" })[0]);

    await waitFor(() => {
      expect(localStorage.getItem("archlucid_core_pilot_step_3_skipped")).toBe("1");
    });
  });
});
