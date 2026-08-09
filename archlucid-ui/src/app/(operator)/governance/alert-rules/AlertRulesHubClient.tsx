"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TABS_PILL_LIST_CLASS, tabsPillTriggerClass } from "@/components/ui/tabs-pill-styles";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ALERT_RULES_HUB_TAB_IDS,
  alertRulesHubTabFromSearchParam,
  type AlertRulesHubTabId,
} from "@/lib/alerts-hub-tab";
import { alertsConfigurationPageSubtitle } from "@/lib/alerts-page-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

import { AlertRulesHubRefreshProvider, useAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import {
  AlertRoutingContentDeferred,
  AlertRulesContentDeferred,
  AlertSimulationTuningSectionDeferred,
  CompositeAlertRulesContentDeferred,
} from "./_sections/alert-rules-hub-deferred-chunks";
import { AlertRulesPageHeader } from "./AlertRulesPageHeader";

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
  notifications: {
    label: "Notifications",
    subtitle: "Where qualifying alerts are delivered",
  },
  "advanced-rules": {
    label: "Advanced rules",
    subtitle: "Combine multiple signals before alerting",
  },
  "test-alerts": {
    label: "Test alerts",
    subtitle: "Simulate and tune alert behavior",
  },
};

/**
 * Page identity first (TB-2093): the hub leads with title, lead, and actions.
 * The former "About alert rules" / "About alert configuration" disclosures are gone —
 * orientation copy now lives behind the single contextual help entry point in the header.
 */
function AlertRulesHubChrome(): React.JSX.Element {
  const { refreshing, lastRefreshedAt, requestRefresh } = useAlertRulesHubRefresh();

  return (
    <AlertRulesPageHeader
      subtitle={alertsConfigurationPageSubtitle(isBuyerPolishedOperatorShellEnv())}
      refreshing={refreshing}
      lastRefreshedAt={lastRefreshedAt}
      onRefresh={requestRefresh}
    />
  );
}

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
    <AlertRulesHubRefreshProvider activeTab={activeTab}>
      <div className="px-0">
        <AlertRulesHubChrome />

        <nav className="mb-6" aria-label="Alerts configuration sections">
          <div className={TABS_PILL_LIST_CLASS} role="tablist">
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
                  title={TAB_CONFIG[id].subtitle}
                  onClick={() => onSelectTab(id)}
                  className={tabsPillTriggerClass(selected)}
                >
                  {TAB_CONFIG[id].label}
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
          {activeTab === "rules" ? <AlertRulesContentDeferred /> : null}
          {activeTab === "notifications" ? <AlertRoutingContentDeferred /> : null}
          {activeTab === "advanced-rules" ? <CompositeAlertRulesContentDeferred /> : null}
          {activeTab === "test-alerts" ? <AlertSimulationTuningSectionDeferred /> : null}
        </div>
      </div>
    </AlertRulesHubRefreshProvider>
  );
}
