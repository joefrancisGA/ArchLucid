import { afterEach, describe, expect, it, vi } from "vitest";

const mockDerivedState = vi.hoisted(() => ({
  current: {
    isPending: false,
    statuses: [] as readonly unknown[],
    progress: { doneCount: 7, totalCount: 7, allDone: true },
    nextStepIndex: null as number | null,
  },
}));

const mockCompareAvailability = vi.hoisted(() => ({
  current: {
    loading: false,
    finalizedCount: 1,
    insufficientForCompare: true,
  },
}));

vi.mock("@/lib/use-core-pilot-derived-step-status", () => ({
  useCorePilotDerivedStepStatus: () => mockDerivedState.current,
}));

vi.mock(
  "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFinalizedRunAvailability",
  () => ({
    useCompareFinalizedRunAvailability: () => mockCompareAvailability.current,
  }),
);

import { render, screen } from "@testing-library/react";

import { CorePilotCompleteCelebrateStrip } from "./CorePilotCompleteCelebrateStrip";

describe("CorePilotCompleteCelebrateStrip", () => {
  afterEach(() => {
    mockDerivedState.current = {
      isPending: false,
      statuses: [],
      progress: { doneCount: 7, totalCount: 7, allDone: true },
      nextStepIndex: null,
    };
    mockCompareAvailability.current = {
      loading: false,
      finalizedCount: 1,
      insufficientForCompare: true,
    };
  });

  it("does not render when core pilot steps are incomplete", () => {
    mockDerivedState.current = {
      isPending: false,
      statuses: [],
      progress: { doneCount: 3, totalCount: 7, allDone: false },
      nextStepIndex: 3,
    };

    render(<CorePilotCompleteCelebrateStrip />);

    expect(screen.queryByTestId("core-pilot-complete-celebrate-strip")).toBeNull();
  });

  it("hides compare when fewer than two finalized reviews exist", () => {
    render(<CorePilotCompleteCelebrateStrip />);

    expect(screen.getByTestId("core-pilot-complete-celebrate-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("core-pilot-complete-compare")).toBeNull();
    expect(screen.getByTestId("core-pilot-complete-sponsor-report")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-complete-body")).toHaveTextContent(
      "Finalize one more review to compare changes over time.",
    );
  });

  it("keeps copy neutral while compare availability is loading", () => {
    mockCompareAvailability.current = {
      loading: true,
      finalizedCount: 0,
      insufficientForCompare: false,
    };

    render(<CorePilotCompleteCelebrateStrip />);

    expect(screen.getByTestId("core-pilot-complete-celebrate-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("core-pilot-complete-compare")).toBeNull();
    expect(screen.getByTestId("core-pilot-complete-sponsor-report")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-complete-body")).toHaveTextContent(
      "Explore analysis tools or share outcomes with your sponsor.",
    );
  });

  it("shows compare when at least two finalized reviews exist", () => {
    mockCompareAvailability.current = {
      loading: false,
      finalizedCount: 2,
      insufficientForCompare: false,
    };

    render(<CorePilotCompleteCelebrateStrip />);

    expect(screen.getByTestId("core-pilot-complete-compare")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews",
    );
    expect(screen.getByTestId("core-pilot-complete-body")).toHaveTextContent(
      "Explore analysis tools or share outcomes with your sponsor.",
    );
  });
});
