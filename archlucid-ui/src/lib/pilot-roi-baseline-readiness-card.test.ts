import { afterEach, describe, expect, it } from "vitest";

import {
  dismissPilotRoiBaselineReadinessCard,
  isPilotRoiBaselineReadinessCardDismissed,
  PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY,
} from "@/lib/pilot-roi-baseline-readiness-card";

describe("pilot-roi-baseline-readiness-card", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("starts undismissed", () => {
    expect(isPilotRoiBaselineReadinessCardDismissed()).toBe(false);
  });

  it("records skip-for-now in local storage", () => {
    dismissPilotRoiBaselineReadinessCard();

    expect(localStorage.getItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY)).toBe("1");
    expect(isPilotRoiBaselineReadinessCardDismissed()).toBe(true);
  });
});
