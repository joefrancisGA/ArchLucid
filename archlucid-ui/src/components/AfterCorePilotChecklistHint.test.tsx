import { afterEach, describe, expect, it, vi } from "vitest";

const mockDerivedState = vi.hoisted(() => ({
  current: {
    isPending: false,
    statuses: [] as readonly unknown[],
    progress: { doneCount: 0, totalCount: 7, allDone: false },
    nextStepIndex: 0 as number | null,
  },
}));

vi.mock("@/lib/use-core-pilot-derived-step-status", () => ({
  useCorePilotDerivedStepStatus: () => mockDerivedState.current,
}));

import { fireEvent, render, screen } from "@testing-library/react";

import { AfterCorePilotChecklistHint } from "./AfterCorePilotChecklistHint";

import {
  AFTER_CORE_PILOT_WHATS_NEXT_DISMISSED_KEY,
  CORE_PILOT_STEP_COUNT,
  corePilotStepDoneStorageKey,
} from "@/lib/core-pilot-checklist-storage";

function markAllCoreStepsDone() {
  for (let i = 0; i < CORE_PILOT_STEP_COUNT; i++) {
    localStorage.setItem(corePilotStepDoneStorageKey(i), "1");
  }
}

describe("AfterCorePilotChecklistHint", () => {
  afterEach(() => {
    localStorage.clear();
    mockDerivedState.current = {
      isPending: false,
      statuses: [],
      progress: { doneCount: 0, totalCount: 7, allDone: false },
      nextStepIndex: 0,
    };
  });

  it("does not render when core checklist steps are incomplete", () => {
    localStorage.setItem(corePilotStepDoneStorageKey(0), "1");
    render(<AfterCorePilotChecklistHint />);

    expect(screen.queryByTestId("after-core-pilot-whats-next")).toBeNull();
  });

  it("renders suggested next steps when all core steps are done", async () => {
    mockDerivedState.current = {
      isPending: false,
      statuses: [],
      progress: { doneCount: 7, totalCount: 7, allDone: true },
      nextStepIndex: null,
    };
    markAllCoreStepsDone();
    render(<AfterCorePilotChecklistHint />);

    expect(await screen.findByTestId("after-core-pilot-whats-next")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ready for more/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/insights/compare-two-reviews");
    expect(screen.getByRole("link", { name: "Explore the architecture graph" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByRole("link", { name: "Set up policy alerts" })).toHaveAttribute(
      "href",
      "/governance/alert-rules",
    );
    expect(screen.getByRole("link", { name: "Review policy packs" })).toHaveAttribute("href", "/governance/policy-packs");
    expect(screen.getByTestId("after-core-pilot-intro")).toBeInTheDocument();
    expect(screen.getByTestId("after-core-pilot-sidebar-note-0")).toBeInTheDocument();
  });

  it("persists dismiss to localStorage and hides the panel", async () => {
    mockDerivedState.current = {
      isPending: false,
      statuses: [],
      progress: { doneCount: 7, totalCount: 7, allDone: true },
      nextStepIndex: null,
    };
    markAllCoreStepsDone();
    const { unmount } = render(<AfterCorePilotChecklistHint />);
    expect(await screen.findByTestId("after-core-pilot-whats-next")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("after-core-pilot-whats-next-dismiss"));
    expect(localStorage.getItem(AFTER_CORE_PILOT_WHATS_NEXT_DISMISSED_KEY)).toBe("1");
    expect(screen.queryByTestId("after-core-pilot-whats-next")).toBeNull();

    unmount();
    markAllCoreStepsDone();
    render(<AfterCorePilotChecklistHint />);
    expect(screen.queryByTestId("after-core-pilot-whats-next")).toBeNull();
  });
});
