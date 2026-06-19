"use client";

import { useCallback, useState } from "react";

import {
  getTenantReviewCycleBaselineHours,
  saveTenantReviewCycleBaseline,
  validateMandatoryWizardBaselineReviewCycleHours,
} from "@/lib/save-tenant-review-cycle-baseline";
import { showError, showSuccess } from "@/lib/toast";
import {
  type WizardBaselineConfidence,
  wizardBaselineConfidenceSourceNote,
} from "@/lib/wizard-baseline-confidence";

import { PILOT_BASELINE_WIZARD_SAVED_EVENT } from "@/lib/pilot-baseline-wizard-events";

/** Shared baseline-metrics step state + mandatory persistence for review wizards (TB-238). */
export function useWizardBaselineMetricsActions() {
  const [baselineReviewCycleHours, setBaselineReviewCycleHours] = useState("");
  const [baselineConfidence, setBaselineConfidence] = useState<WizardBaselineConfidence>("unsure");
  const [baselineMetricsError, setBaselineMetricsError] = useState<string | null>(null);

  const persistBaselineMetricsIfNeeded = useCallback(async (): Promise<boolean> => {
    const validationError = validateMandatoryWizardBaselineReviewCycleHours(baselineReviewCycleHours);

    if (validationError !== null) {
      setBaselineMetricsError(validationError);

      return false;
    }

    setBaselineMetricsError(null);

    const trimmed = baselineReviewCycleHours.trim();

    if (trimmed.length === 0) {
      const existingHours = await getTenantReviewCycleBaselineHours();

      if (existingHours !== null) {
        return true;
      }

      setBaselineMetricsError(
        "Enter how many hours a typical architecture review takes before continuing.",
      );

      return false;
    }

    const hours = Number(trimmed);
    const result = await saveTenantReviewCycleBaseline({
      baselineReviewCycleHours: hours,
      baselineReviewCycleSourceNote: wizardBaselineConfidenceSourceNote(baselineConfidence),
    });

    if (!result.ok) {
      setBaselineMetricsError(result.message);
      showError("Wizard", result.message);

      return false;
    }

    showSuccess("Review-cycle baseline saved for ROI reporting.");
    setBaselineReviewCycleHours("");

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_SAVED_EVENT));
    }

    return true;
  }, [baselineConfidence, baselineReviewCycleHours]);

  return {
    baselineReviewCycleHours,
    setBaselineReviewCycleHours,
    baselineConfidence,
    setBaselineConfidence,
    baselineMetricsError,
    setBaselineMetricsError,
    persistBaselineMetricsIfNeeded,
  };
}
