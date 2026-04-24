import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DRAFT_TOUR_STEPS,
  OptInTour,
  TOUR_DISMISSED_LOCAL_STORAGE_KEY,
  TourStepListForTesting,
} from "./OptInTour";
import { OptInTourLauncher } from "./OptInTourLauncher";
import { TOUR_PENDING_APPROVAL_MARKER } from "./TourStepPendingApproval";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("OptInTour script", () => {
  it("contains exactly five steps (PENDING_QUESTIONS.md item 38, owner Q8 — 2026-04-23)", () => {
    expect(DRAFT_TOUR_STEPS).toHaveLength(5);
  });

  it("every step body is non-empty draft copy", () => {
    for (const step of DRAFT_TOUR_STEPS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
    }
  });
});

describe("TourStepListForTesting (owner Q8 marker per step)", () => {
  it("renders the pending-approval marker for every one of the five steps", () => {
    render(<TourStepListForTesting />);

    const markers = screen.getAllByTestId("tour-pending-approval-marker");
    expect(markers).toHaveLength(DRAFT_TOUR_STEPS.length);

    for (const marker of markers) {
      expect(marker.textContent).toBe(TOUR_PENDING_APPROVAL_MARKER);
    }
  });
});

describe("OptInTour rendering (controlled)", () => {
  it("renders nothing when isOpen=false (no auto-launch on mount per owner Q9)", () => {
    render(<OptInTour isOpen={false} onClose={() => {}} />);

    expect(screen.queryByTestId("opt-in-tour-dialog")).toBeNull();
  });

  it("renders step 0 when isOpen=true", () => {
    render(<OptInTour isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId("opt-in-tour-dialog")).not.toBeNull();
    expect(screen.getByTestId("opt-in-tour-step-0")).not.toBeNull();
  });

  it("close button persists the dismissal LocalStorage flag", () => {
    const onClose = vi.fn();
    render(<OptInTour isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("opt-in-tour-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(TOUR_DISMISSED_LOCAL_STORAGE_KEY)).not.toBeNull();
  });

  it("Next advances through every step then shows Finish on the last step", () => {
    render(<OptInTour isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId("opt-in-tour-step-0")).not.toBeNull();

    for (let i = 1; i < DRAFT_TOUR_STEPS.length; i++) {
      fireEvent.click(screen.getByTestId("opt-in-tour-next"));
      expect(screen.getByTestId(`opt-in-tour-step-${i}`)).not.toBeNull();
    }

    expect(screen.queryByTestId("opt-in-tour-next")).toBeNull();
    expect(screen.getByTestId("opt-in-tour-finish")).not.toBeNull();
  });
});

describe("OptInTourLauncher (owner Q9 — never auto-launch)", () => {
  it("does NOT render the tour dialog on mount", () => {
    render(<OptInTourLauncher />);

    expect(screen.getByTestId("opt-in-tour-launcher")).not.toBeNull();
    expect(screen.queryByTestId("opt-in-tour-dialog")).toBeNull();
  });

  it("renders the tour dialog only after the 'Show me around' button is clicked", () => {
    render(<OptInTourLauncher />);

    fireEvent.click(screen.getByTestId("opt-in-tour-launcher"));

    expect(screen.getByTestId("opt-in-tour-dialog")).not.toBeNull();
    expect(screen.getByTestId("opt-in-tour-step-0")).not.toBeNull();
  });

  it("re-opens the tour even after a previous dismissal flag is present", () => {
    window.localStorage.setItem(TOUR_DISMISSED_LOCAL_STORAGE_KEY, "2026-04-24T10:00:00.000Z");

    render(<OptInTourLauncher />);

    fireEvent.click(screen.getByTestId("opt-in-tour-launcher"));

    expect(screen.getByTestId("opt-in-tour-dialog")).not.toBeNull();
  });

  it("first step inside the dialog renders the pending-approval marker", () => {
    render(<OptInTourLauncher />);
    fireEvent.click(screen.getByTestId("opt-in-tour-launcher"));

    expect(screen.getByTestId("tour-pending-approval-marker").textContent)
      .toBe(TOUR_PENDING_APPROVAL_MARKER);
  });
});
