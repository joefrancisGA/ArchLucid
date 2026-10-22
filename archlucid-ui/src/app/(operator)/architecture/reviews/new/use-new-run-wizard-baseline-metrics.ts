"use client";

import { useWizardBaselineMetricsActions } from "@/lib/use-wizard-baseline-metrics-actions";

/** Baseline metrics step state for the new-run wizard. */
export function useNewRunWizardBaselineMetrics() {
  return useWizardBaselineMetricsActions();
}
