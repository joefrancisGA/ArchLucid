"use client";

import { cn } from "@/lib/utils";
import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { alertTestAlertsTabLead } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const ALERT_TEST_TUNE_SECTION_TITLE = "Tune alert thresholds";

/**
 * Merged **Simulation** and **Tuning** tab for the `/alerts` hub — simulate primary; tune in disclosure.
 */
export function AlertSimulationTuningSection() {
  return (
    <div className="space-y-6">
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
      <CollapsibleSection
        title={ALERT_TEST_TUNE_SECTION_TITLE}
        headingLevel={3}
        defaultOpen={false}
        sectionTestId="alert-test-tune-disclosure"
        summaryLine="Optional threshold recommendations against recent reviews (read-only on this tab)."
      >
        <AlertTuningContent />
      </CollapsibleSection>
    </div>
  );
}
