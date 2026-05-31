import { afterEach, describe, expect, it } from "vitest";

import {
  dismissPilotRoiBaselineReadinessCardForSession,
  isPilotRoiBaselineReadinessCardDismissedForSession,
  PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_SESSION_KEY,
} from "@/lib/pilot-roi-baseline-readiness-card";

describe("pilot-roi-baseline-readiness-card", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("starts undismissed for the session", () => {
    expect(isPilotRoiBaselineReadinessCardDismissedForSession()).toBe(false);
  });

  it("records skip-for-now in session storage", () => {
    dismissPilotRoiBaselineReadinessCardForSession();

    expect(sessionStorage.getItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_SESSION_KEY)).toBe("1");
    expect(isPilotRoiBaselineReadinessCardDismissedForSession()).toBe(true);
  });
});
