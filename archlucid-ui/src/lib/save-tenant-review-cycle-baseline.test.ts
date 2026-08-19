import { describe, expect, it, vi } from "vitest";

import {
  getTenantReviewCycleBaselineHours,
  validateMandatoryWizardBaselineReviewCycleHours,
  validateWizardBaselineReviewCycleHours,
} from "@/lib/save-tenant-review-cycle-baseline";

describe("validateMandatoryWizardBaselineReviewCycleHours", () => {
  it("allows empty input for tenant-already-captured follow-up", () => {
    expect(validateMandatoryWizardBaselineReviewCycleHours("")).toBeNull();
  });

  it("delegates non-empty values to standard validation", () => {
    expect(validateMandatoryWizardBaselineReviewCycleHours("40")).toBeNull();
    expect(validateMandatoryWizardBaselineReviewCycleHours("-1")).toBe(
      "Review cycle time must be between 0 and 10,000 (exclusive of zero).",
    );
  });
});

describe("validateWizardBaselineReviewCycleHours", () => {
  it("still allows blank optional validation in settings-style flows", () => {
    expect(validateWizardBaselineReviewCycleHours("")).toBeNull();
  });
});

describe("getTenantReviewCycleBaselineHours", () => {
  it("returns null when baseline is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ baselineReviewCycleHours: null }),
      })),
    );

    await expect(getTenantReviewCycleBaselineHours()).resolves.toBeNull();

    vi.unstubAllGlobals();
  });

  it("returns positive hours when baseline exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ baselineReviewCycleHours: 32 }),
      })),
    );

    await expect(getTenantReviewCycleBaselineHours()).resolves.toBe(32);

    vi.unstubAllGlobals();
  });
});
