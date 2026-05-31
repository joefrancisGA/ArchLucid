import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PilotRoiBaselineReadinessCard } from "@/components/operator-home/PilotRoiBaselineReadinessCard";
import { PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY } from "@/lib/pilot-roi-baseline-readiness-card";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";

const reload = vi.fn();

vi.mock("@/hooks/use-pilot-roi-baseline-completeness", () => ({
  usePilotRoiBaselineCompleteness: () => ({
    loading: false,
    complete: false,
    reload,
  }),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/pilot-roi-baseline-chrome", () => ({
  suppressPilotRoiBaselineChrome: () => false,
}));

describe("PilotRoiBaselineReadinessCard", () => {
  beforeEach(() => {
    localStorage.clear();
    reload.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders when tenant ROI baselines are incomplete", () => {
    render(<PilotRoiBaselineReadinessCard />);

    expect(screen.getByTestId("pilot-roi-baseline-readiness-card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ROI baseline not set" })).toBeInTheDocument();
    expect(
      screen.getByText(/estimate time saved after your first review package/i),
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

  it("hides after Skip for now", async () => {
    render(<PilotRoiBaselineReadinessCard />);
    fireEvent.click(screen.getByTestId("pilot-roi-baseline-readiness-skip"));

    await waitFor(() => {
      expect(screen.queryByTestId("pilot-roi-baseline-readiness-card")).not.toBeInTheDocument();
    });

    expect(localStorage.getItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY)).toBe("1");
  });
});
