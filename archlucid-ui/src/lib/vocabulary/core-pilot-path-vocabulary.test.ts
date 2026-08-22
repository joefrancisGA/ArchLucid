import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_PATH_BANNED_PHRASES,
  CORE_PILOT_PATH_STREAMLINED_LABELS,
  isStreamlinedCorePilotPath,
  listCorePilotPathCopyViolations,
} from "@/lib/vocabulary/core-pilot-path-vocabulary";
import { PILOT_PATH_PREVIEW_STEPS } from "@/lib/buyer/buyer-polish-copy";
import { FOCUSED_PILOT_MODE_COPY } from "@/lib/focused-pilot-mode-policy-packs";

describe("core-pilot-path-vocabulary", () => {
  it("treats tenants without a committed review as streamlined", () => {
    expect(isStreamlinedCorePilotPath(false)).toBe(true);
    expect(isStreamlinedCorePilotPath(true)).toBe(false);
  });

  it("flags banned governance and policy-pack phrases in pilot-path surfaces", () => {
    const violations = listCorePilotPathCopyViolations({
      bad: "Open Resolve outcomes workflow and edit Policy Pack rules",
      good: CORE_PILOT_PATH_STREAMLINED_LABELS.firstIntakeLead,
    });

    expect(violations).toHaveLength(2);
    expect(violations[0]).toContain("governance");
    expect(violations[1]).toContain("policy pack");
  });

  it("keeps streamlined first-run copy free of banned phrases", () => {
    const surfaces = {
      operateUnlock: CORE_PILOT_PATH_STREAMLINED_LABELS.operateUnlockLead,
      operateStillHidden: CORE_PILOT_PATH_STREAMLINED_LABELS.operateUnlockStillHidden,
      firstIntake: CORE_PILOT_PATH_STREAMLINED_LABELS.firstIntakeLead,
      firstReviewBanner: `${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerLabel} ${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerBody}`,
      focusedPilotToggle: FOCUSED_PILOT_MODE_COPY.toggleDescription,
      focusedPilotCallout: `${FOCUSED_PILOT_MODE_COPY.appliedCalloutTitle} ${FOCUSED_PILOT_MODE_COPY.appliedCalloutBody}`,
      autoUnlockHint: CORE_PILOT_PATH_STREAMLINED_LABELS.operateAutoUnlockHint,
    };

    expect(listCorePilotPathCopyViolations(surfaces)).toEqual([]);
    expect(CORE_PILOT_PATH_STREAMLINED_LABELS.focusedPilotToggleLabel).toBe("Focused review scope");
    expect(CORE_PILOT_PATH_STREAMLINED_LABELS.firstIntakeAdvancedNote.toLowerCase()).not.toContain("pilot");
    expect(
      `${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerLabel} ${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerBody}`.toLowerCase(),
    ).not.toContain("intake");
    expect(
      `${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerLabel} ${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerBody}`.toLowerCase(),
    ).not.toContain(
      "evaluation standards",
    );
    expect(
      `${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerLabel} ${CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBannerBody}`.toLowerCase(),
    ).not.toContain("pilot");
    expect(CORE_PILOT_PATH_BANNED_PHRASES).toContain("governance");
    expect(CORE_PILOT_PATH_BANNED_PHRASES).toContain("policy pack");
  });

  it("pilot path preview step 3 uses finalize vocabulary", () => {
    const finalizeStep = PILOT_PATH_PREVIEW_STEPS.find((step) => step.id === "commit");

    expect(finalizeStep?.label).toBe("Finalize review");
    expect(finalizeStep?.label.toLowerCase()).not.toContain("commit");
  });
});
