"use client";

import { cn } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";
import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import { AlertSimulationTuningSection } from "@/components/alerts/AlertSimulationTuningSection";
import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  ALERT_RULES_HUB_TAB_IDS,
  alertRulesHubTabFromSearchParam,
  type AlertRulesHubTabId,
} from "@/lib/alerts-hub-tab";
import { ALERT_RULES_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const TAB_PARAM = "tab";

const TAB_LABEL: Record<AlertRulesHubTabId, string> = {
  rules: "Alert rules",
  routing: "Routing",
  composite: "Composite",
  simulation: "Simulation & Tuning",
};

/**
 * Alert rule configuration hub — separate from the Alerts triage inbox (Option A IA).
 */
export function AlertRulesHubClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get(TAB_PARAM);

  const activeTab: AlertRulesHubTabId = useMemo(
    () => alertRulesHubTabFromSearchParam(rawTab),
    [rawTab],
  );

  const onSelectTab = useCallback(
    (id: AlertRulesHubTabId) => {
      router.push(governanceAlertRulesTabHref(id));
    },
    [router],
  );

  return (
    <div className="px-0">
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.alertRules}
        subtitle={ALERT_RULES_PAGE_SUBTITLE}
        titleTestId="alert-rules-page-title"
        actions={<PageContextualHelpButton />}
      />

      <nav
        className="mb-4 border-b border-neutral-200 dark:border-neutral-800"
        aria-label="Alert rules sections"
      >
        <div className="-mb-px flex flex-wrap gap-1" role="tablist">
          {ALERT_RULES_HUB_TAB_IDS.map((id) => {
            const selected = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`alert-rules-hub-tab-${id}`}
                data-testid={`alert-rules-hub-tab-${id}`}
                onClick={() => onSelectTab(id)}
                className={cn(
                  "rounded-t-md border border-b-0 px-3 py-2",
                  OPERATOR_TYPOGRAPHY.body,
                  "font-medium",
                  selected
                    ? "border-neutral-200 bg-white text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950"
                    : "border-transparent bg-transparent text-al-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-900",
                )}
              >
                {TAB_LABEL[id]}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        className="min-w-0"
        role="tabpanel"
        aria-labelledby={`alert-rules-hub-tab-${activeTab}`}
        data-testid="alert-rules-hub-panel"
      >
        {activeTab === "rules" ? <AlertRulesContent /> : null}
        {activeTab === "routing" ? <AlertRoutingContent /> : null}
        {activeTab === "composite" ? <CompositeAlertRulesContent /> : null}
        {activeTab === "simulation" ? <AlertSimulationTuningSection /> : null}
      </div>
    </div>
  );
}
