"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTestAlertsBuyerChrome } from "@/components/alerts/AlertTestAlertsBuyerChrome";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { StatusTag } from "@/components/ui/status-tag";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  alertSimulationTuningDisclosureHrefFromSearch,
  parseAlertTuneDisclosureOpenFromSearch,
} from "@/lib/alerts/alert-simulation-tuning-disclosure-url";
import {
  ALERT_TEST_ALERTS_TAB_BUYER_START_HERE_HELPER,
  ALERT_TEST_ALERTS_TAB_PAGE_LEAD,
} from "@/lib/alert-test-alerts-tab-copy";
import { alertTestAlertsTabLead } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const ALERT_TEST_TUNE_SECTION_TITLE = "Tune alert thresholds";

/**
 * Merged **Simulation** and **Tuning** tab for the `/alerts` hub — simulate primary; tune in disclosure.
 */
export function AlertSimulationTuningSection() {
  const buyerPolishedShell = useProductionEvalChrome();
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
      {buyerPolishedShell ? (
        <div
          className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
          data-testid="alert-test-alerts-first-viewport"
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag
              kind="neutral"
              label="Dry run"
              data-testid="alert-test-alerts-dry-run-tag"
            />
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="alert-test-alerts-intro"
            >
              {ALERT_TEST_ALERTS_TAB_PAGE_LEAD}
            </p>
          </div>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="alert-test-alerts-buyer-start-here-helper"
          >
            {ALERT_TEST_ALERTS_TAB_BUYER_START_HERE_HELPER}
          </p>
        </div>
      ) : (
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
      )}
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
      <AlertTestAlertsBuyerChrome />
    </div>
  );
}
