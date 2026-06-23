"use client";

import { ArchitectureComparisonReplayCostSection } from "@/app/(operator)/compare/_sections/ArchitectureComparisonReplayCostSection";

/** Collapsed advanced tooling on Compare — comparison replay cost estimate and related diagnostics. */
export function CompareAdvancedDiagnosticsSection() {
  return (
    <details
      className="mt-10 mb-4 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="compare-advanced-diagnostics"
    >
      <summary className="cursor-pointer text-sm font-medium text-neutral-800 dark:text-neutral-200">Advanced diagnostics</summary>
      <div className="mt-3">
        <ArchitectureComparisonReplayCostSection />
      </div>
    </details>
  );
}
