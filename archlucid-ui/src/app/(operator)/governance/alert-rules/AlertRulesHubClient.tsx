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
import {
  ALERTS_CONFIGURATION_PAGE_SUBTITLE,
  ALERTS_CONFIGURATION_PAGE_TITLE,
} from "@/lib/alerts-page-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const TAB_PARAM = "tab";

type AlertRulesHubTabConfig = {
  label: string;
  subtitle: string;
};

const TAB_CONFIG: Record<AlertRulesHubTabId, AlertRulesHubTabConfig> = {
  rules: {
    label: "Conditions",
    subtitle: "When completed reviews should raise an alert",
  },
  routing: {
    label: "Notifications",
    subtitle: "Where qualifying alerts are delivered",
  },
  composite: {
    label: "Advanced rules",
    subtitle: "Combine multiple signals before alerting",
  },
  simulation: {
    label: "Test alerts",
    subtitle: "Simulate and tune alert behavior",
  },
};

/**
 * Alert configuration hub — separate from the Alert inbox triage surface.
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
        title={ALERTS_CONFIGURATION_PAGE_TITLE}
        subtitle={ALERTS_CONFIGURATION_PAGE_SUBTITLE}
        titleTestId="alert-rules-page-title"
        actions={<PageContextualHelpButton />}
      />

      <nav
        className="mb-6 border-b border-neutral-200 dark:border-neutral-800"
        aria-label="Alerts configuration sections"
      >
        <div className="-mb-px flex flex-wrap gap-1" role="tablist">
          {ALERT_RULES_HUB_TAB_IDS.map((id) => {
            const selected = activeTab === id;
            const config = TAB_CONFIG[id];

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
                  "rounded-t-md border border-b-0 px-4 py-2 text-left",
                  selected
                    ? "border-neutral-300 bg-white text-al-text-primary shadow-sm dark:border-neutral-600 dark:bg-neutral-950"
                    : "border-transparent bg-transparent text-al-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-900",
                )}
              >
                <span className={cn("block font-semibold", OPERATOR_TYPOGRAPHY.body)}>{config.label}</span>
                <span className={cn("block text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {config.subtitle}
                </span>
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
