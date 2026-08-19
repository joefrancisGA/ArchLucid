/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PlanningClaimDisciplineCallout } from "@/app/(operator)/insights/improvement-planning/_sections/PlanningClaimDisciplineCallout";
import { PLANNING_CLAIM_DISCIPLINE } from "@/lib/planning-evidence-copy";

const DISMISS_KEY = "archlucid_planning_claim_discipline_dismissed_v1";

describe("PlanningClaimDisciplineCallout", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DISMISS_KEY);
  });

  it("shows the amber callout until dismissed, then a residual honesty line", async () => {
    render(<PlanningClaimDisciplineCallout />);

    expect(await screen.findByTestId("planning-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(PLANNING_CLAIM_DISCIPLINE)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("planning-claim-discipline")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("planning-claim-discipline-residual")).toHaveTextContent(PLANNING_CLAIM_DISCIPLINE);
    expect(window.localStorage.getItem(DISMISS_KEY)).toBe("1");
  });
});
