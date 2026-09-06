"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { StatusTag } from "@/components/ui/status-tag";
import {
  alertSimulationTuningDisclosureHrefFromSearch,
  parseAlertTuneDisclosureOpenFromSearch,
} from "@/lib/alerts/alert-simulation-tuning-disclosure-url";
import { alertTestAlertsTabLead } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const ALERT_TEST_TUNE_SECTION_TITLE = "Tune alert thresholds";

/**
 * Merged **Simulation** and **Tuning** tab for the `/alerts` hub — simulate primary; tune in disclosure.
 */
export function AlertSimulationTuningSection() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const alertTuneDisclosureOpenParam = searchParams.get("alertTuneDisclosureOpen");
  const [tuneOpen, setTuneOpenState] = useState(() =>
    parseAlertTuneDisclosureOpenFromSearch(alertTuneDisclosureOpenParam),
  );

  const syncTuneOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(alertSimulationTuningDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setTuneOpen = useCallback(
    (open: boolean) => {
      setTuneOpenState(open);
      syncTuneOpenToUrl(open);
    },
    [syncTuneOpenToUrl],
  );

  useEffect(() => {
    setTuneOpenState(parseAlertTuneDisclosureOpenFromSearch(alertTuneDisclosureOpenParam));
  }, [alertTuneDisclosureOpenParam]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusTag
            kind="neutral"
            label="Dry run"
            data-testid="alert-test-alerts-dry-run-tag"
          />
          <p
            className={cn(
              "m-0 max-w-prose leading-snug text-neutral-600 dark:text-neutral-400",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="alert-test-alerts-tab-lead"
          >
            {alertTestAlertsTabLead}
          </p>
        </div>
        <div data-testid="alert-test-alerts-tab-rank-cue">
          <AlertOperatorToolingRankCue className="mb-6" />
        </div>
      </div>
      <AlertSimulationContent />
      <CollapsibleSection
        title={ALERT_TEST_TUNE_SECTION_TITLE}
        headingLevel={3}
        open={tuneOpen}
        onToggle={setTuneOpen}
        sectionTestId="alert-test-tune-disclosure"
        summaryLine="Optional threshold recommendations against recent reviews (read-only on this tab)."
      >
        <AlertTuningContent />
      </CollapsibleSection>
    </div>
  );
}
