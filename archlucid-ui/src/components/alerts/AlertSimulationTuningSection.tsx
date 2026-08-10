"use client";

import { cn } from "@/lib/utils";
import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { alertTestAlertsTabLead } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/**
 * Merged **Simulation** and **Tuning** tab for the `/alerts` hub — two existing page bodies stacked.
 */
export function AlertSimulationTuningSection() {
  return (
    <div className="space-y-14">
      <div>
        <p
          className={cn(
            "mb-2 max-w-prose leading-snug text-neutral-600 dark:text-neutral-400",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="alert-test-alerts-tab-lead"
        >
          {alertTestAlertsTabLead}
        </p>
        <div data-testid="alert-test-alerts-tab-rank-cue">
          <AlertOperatorToolingRankCue className="mb-6" />
        </div>
      </div>
      <AlertSimulationContent />
      <AlertTuningContent />
    </div>
  );
}
