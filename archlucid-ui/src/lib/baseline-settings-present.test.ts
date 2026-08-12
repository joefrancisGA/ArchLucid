import { describe, expect, it } from "vitest";

import {
  baselineFieldHasOwnerEstimate,
  baselineFieldProvenanceLabel,
  baselineSettingsStatusLabel,
  baselineSettingsStatusTagKind,
  resolveBaselineRoiModelLabel,
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
    expect(baselineSettingsStatusTagKind("complete")).toBe("ready");
    expect(baselineSettingsStatusTagKind("partial")).toBe("needs-attention");
    expect(baselineSettingsStatusTagKind("not-set")).toBe("neutral");
  });

  it("labels ROI model by completeness instead of any single populated field", () => {
    const partialSnapshot = {
      manualPrepHoursPerReview: 4,
      peoplePerReview: null,
      capturedUtc: null,
      baselineReviewCycleHours: null,
      baselineReviewCycleSource: null,
      baselineReviewCycleCapturedUtc: null,
    };

    expect(resolveBaselineSettingsStatus(partialSnapshot)).toBe("partial");
    expect(resolveBaselineRoiModelLabel(partialSnapshot)).toBe("Partly modeled");
    expect(resolveBaselineRoiModelLabel(partialSnapshot)).not.toBe("Workspace-specific baseline");

    const completeSnapshot = {
      manualPrepHoursPerReview: 4,
      peoplePerReview: 3,
      capturedUtc: "2026-01-01T00:00:00Z",
      baselineReviewCycleHours: 12,
      baselineReviewCycleSource: "baseline_settings",
      baselineReviewCycleCapturedUtc: "2026-01-01T00:00:00Z",
    };

    expect(resolveBaselineRoiModelLabel(completeSnapshot)).toBe("Workspace-specific baseline");
  });

  it("labels field provenance for modeled default vs owner estimate", () => {
    expect(baselineFieldHasOwnerEstimate("")).toBe(false);
    expect(baselineFieldProvenanceLabel(false)).toBe("Modeled default");
    expect(baselineFieldHasOwnerEstimate("12")).toBe(true);
    expect(baselineFieldProvenanceLabel(true)).toBe("Your estimate");
  });
});
