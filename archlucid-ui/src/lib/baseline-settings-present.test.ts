import { describe, expect, it } from "vitest";

import {
  baselineSettingsStatusLabel,
  resolveBaselineSaveToastMessage,
  resolveBaselineSettingsStatus,
  validateBaselineReviewCycleHours,
} from "@/lib/baseline-settings-present";

describe("baseline-settings-present", () => {
  it("classifies baseline completeness for summary card", () => {
    expect(
      resolveBaselineSettingsStatus({
        manualPrepHoursPerReview: null,
        peoplePerReview: null,
        capturedUtc: null,
        baselineReviewCycleHours: null,
        baselineReviewCycleSource: null,
        baselineReviewCycleCapturedUtc: null,
      }),
    ).toBe("not-set");

    expect(
      resolveBaselineSettingsStatus({
        manualPrepHoursPerReview: 4,
        peoplePerReview: null,
        capturedUtc: null,
        baselineReviewCycleHours: null,
        baselineReviewCycleSource: null,
        baselineReviewCycleCapturedUtc: null,
      }),
    ).toBe("partial");

    expect(
      resolveBaselineSettingsStatus({
        manualPrepHoursPerReview: 4,
        peoplePerReview: 3,
        capturedUtc: "2026-01-01T00:00:00Z",
        baselineReviewCycleHours: 12,
        baselineReviewCycleSource: "baseline_settings",
        baselineReviewCycleCapturedUtc: "2026-01-01T00:00:00Z",
      }),
    ).toBe("complete");
  });

  it("warns on extremely high review-cycle hours without blocking save", () => {
    const validation = validateBaselineReviewCycleHours("240");

    expect(validation.error).toBeNull();
    expect(validation.warning).toMatch(/unusually high/i);
  });

  it("chooses save confirmation copy for blank, partial, and complete saves", () => {
    expect(
      resolveBaselineSaveToastMessage({
        manualPrepHoursPerReview: null,
        peoplePerReview: null,
        baselineReviewCycleHours: null,
      }),
    ).toBe("Using conservative defaults.");

    expect(
      resolveBaselineSaveToastMessage({
        manualPrepHoursPerReview: 2,
        peoplePerReview: null,
        baselineReviewCycleHours: null,
      }),
    ).toMatch(/Partial baseline saved/i);

    expect(
      resolveBaselineSaveToastMessage({
        manualPrepHoursPerReview: 2,
        peoplePerReview: 3,
        baselineReviewCycleHours: 12,
      }),
    ).toBe("Baseline settings saved.");
  });

  it("labels baseline status for display", () => {
    expect(baselineSettingsStatusLabel("not-set")).toBe("Not set");
    expect(baselineSettingsStatusLabel("partial")).toBe("Partially set");
    expect(baselineSettingsStatusLabel("complete")).toBe("Complete");
  });
});
