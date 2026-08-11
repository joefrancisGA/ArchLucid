import { describe, expect, it } from "vitest";

import {
  EXECUTIVE_SCORECARD_AVERAGE_MANUAL_REVIEW_HOURS,
  resolveExecutiveScorecardHoursSavedDisplay,
} from "./executive-scorecard-hours-saved-display";

describe("executive-scorecard-hours-saved-display (TB-1534)", () => {
  it("shows severity-weighted hours when weighted ROI is positive", () => {
    const display = resolveExecutiveScorecardHoursSavedDisplay({
      hoursRoi: 12,
      reviewsCount: 4,
      buyerPolished: true,
      precommitBlocksExact: true,
    });

    expect(display.valueText).toBe("12 h");
    expect(display.caption).toContain("methodology in pilot guide");
  });

  it("does not render an unlabeled positive fallback when weighted hours are zero (buyer-polished)", () => {
    const display = resolveExecutiveScorecardHoursSavedDisplay({
      hoursRoi: 0,
      reviewsCount: 4,
      buyerPolished: true,
      precommitBlocksExact: true,
    });

    expect(display.valueText).toBe("—");
    expect(display.valueText).not.toBe(
      `${4 * EXECUTIVE_SCORECARD_AVERAGE_MANUAL_REVIEW_HOURS} h`,
    );
    expect(display.caption).toContain("Not enough severity data");
  });

  it("labels operator-shell fallback estimates explicitly", () => {
    const display = resolveExecutiveScorecardHoursSavedDisplay({
      hoursRoi: 0,
      reviewsCount: 4,
      buyerPolished: false,
      precommitBlocksExact: true,
    });

    expect(display.valueText).toBe("Est. 12 h");
    expect(display.caption).toContain("Estimate");
    expect(display.caption).not.toContain("fallback");
  });
});
