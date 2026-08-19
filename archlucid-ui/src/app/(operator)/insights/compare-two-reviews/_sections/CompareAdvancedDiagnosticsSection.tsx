"use client";

import { cn } from "@/lib/utils";
import { ArchitectureComparisonReplayCostSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/ArchitectureComparisonReplayCostSection";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Collapsed advanced tooling on Compare — comparison replay cost estimate and related diagnostics. */
export function CompareAdvancedDiagnosticsSection() {
  return (
    <details
      className={cn(
        "mt-10 mb-4 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="compare-advanced-diagnostics"
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>Advanced diagnostics</summary>
      <div className="mt-3">
        <ArchitectureComparisonReplayCostSection />
      </div>
    </details>
  );
}
