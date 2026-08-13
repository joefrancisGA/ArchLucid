import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PilotRoiBaselineReadinessCard } from "@/components/operator-home/PilotRoiBaselineReadinessCard";
import { PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY } from "@/lib/pilot-roi-baseline-readiness-card";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";

const reload = vi.fn();
const committedReviewMock = vi.hoisted(() => ({ value: true }));

vi.mock("@/hooks/use-pilot-roi-baseline-completeness", () => ({
  usePilotRoiBaselineCompleteness: () => ({
    loading: false,
    complete: false,
    reload,
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isNextPublicDemoMode: () => false,
};
});

vi.mock("@/lib/pilot-roi-baseline-chrome", () => ({
  suppressPilotRoiBaselineChrome: () => false,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
}));

describe("PilotRoiBaselineReadinessCard", () => {
  beforeEach(() => {
    localStorage.clear();
    reload.mockReset();
    committedReviewMock.value = true;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders nothing before the tenant has a committed review", () => {
    committedReviewMock.value = false;

    render(<PilotRoiBaselineReadinessCard />);

    expect(screen.queryByTestId("pilot-roi-baseline-readiness-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pilot-roi-baseline-readiness-compact")).not.toBeInTheDocument();
  });

  it("renders when tenant ROI baselines are incomplete", () => {
    render(<PilotRoiBaselineReadinessCard />);

    expect(screen.getByTestId("pilot-roi-baseline-readiness-card")).toBeInTheDocument();
    expect(screen.getByText("ROI estimate pending")).toBeInTheDocument();
    expect(
      screen.getByText(/Add estimated effort and cost assumptions/i),
    ).toBeInTheDocument();
  });

  it("dispatches wizard open when Set baseline is clicked", () => {
    const listener = vi.fn();

    window.addEventListener(PILOT_BASELINE_WIZARD_OPEN_EVENT, listener);

    render(<PilotRoiBaselineReadinessCard />);
    fireEvent.click(screen.getByTestId("pilot-roi-baseline-readiness-set"));

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(PILOT_BASELINE_WIZARD_OPEN_EVENT, listener);
  });

  it("hides compact ROI pending strip when dismissed before a committed review (TB-349)", () => {
    committedReviewMock.value = false;
    localStorage.setItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY, "1");

    render(<PilotRoiBaselineReadinessCard />);

    expect(screen.queryByTestId("pilot-roi-baseline-readiness-compact")).not.toBeInTheDocument();
  });

  it("shows compact row after dismiss for this review", async () => {
    render(<PilotRoiBaselineReadinessCard />);
    fireEvent.click(screen.getByTestId("pilot-roi-baseline-readiness-skip"));

    await waitFor(() => {
      expect(screen.queryByTestId("pilot-roi-baseline-readiness-card")).not.toBeInTheDocument();
      expect(screen.getByTestId("pilot-roi-baseline-readiness-compact")).toBeInTheDocument();
    });

    expect(localStorage.getItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY)).toBe("1");
  });

  it("shows compact row after X dismiss", async () => {
    render(<PilotRoiBaselineReadinessCard />);
    fireEvent.click(screen.getByTestId("pilot-roi-baseline-readiness-dismiss"));

    await waitFor(() => {
      expect(screen.getByTestId("pilot-roi-baseline-readiness-compact")).toBeInTheDocument();
    });
  });
});
