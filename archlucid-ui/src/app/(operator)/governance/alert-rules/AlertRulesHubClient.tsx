"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AlertRulesAlertsInboxVocabularyRail } from "@/components/AlertRulesAlertsInboxVocabularyRail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ALERT_RULES_HUB_TAB_IDS,
  ALERT_RULES_HUB_TAB_PARAM,
  alertRulesHubTabFromSearchParam,
  readAlertRulesHubTabFromWindowLocation,
  writeAlertRulesHubTabToUrl,
  type AlertRulesHubTabId,
} from "@/lib/alerts-hub-tab";
import { ALERT_RULES_TAB_LABEL } from "@/lib/alert-rule-conditions-copy";
import { COMPOSITE_RULES_TAB_LABEL } from "@/lib/enterprise-controls-context-copy";
import { alertsConfigurationPageSubtitle } from "@/lib/alerts-page-copy";
import { whyDisabledNeedsPrerequisite } from "@/lib/why-disabled-cta";

import { AlertRulesHubRefreshProvider, useAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import {
  AlertRoutingContentDeferred,
  AlertRulesContentDeferred,
  AlertSimulationTuningSectionDeferred,
  CompositeAlertRulesContentDeferred,
} from "./_sections/alert-rules-hub-deferred-chunks";
import { AlertRulesPageHeader } from "./AlertRulesPageHeader";
import { AlertRulesHubTabCountsBootstrap } from "./AlertRulesHubTabCountsBootstrap";

type AlertRulesHubTabConfig = {
  label: string;
};

const TAB_CONFIG: Record<AlertRulesHubTabId, AlertRulesHubTabConfig> = {
  rules: {
    label: ALERT_RULES_TAB_LABEL,
  },
  notifications: {
    label: "Notifications",
  },
  "advanced-rules": {
    label: COMPOSITE_RULES_TAB_LABEL,
  },
  "test-alerts": {
    label: "Test alerts",
  },
};

function alertRulesHubTabLabel(tabId: AlertRulesHubTabId, count: number | undefined): string {
  const baseLabel = TAB_CONFIG[tabId].label;

  if (count === undefined) {
    return baseLabel;
  }

  return `${baseLabel} (${count})`;
}

/**
 * Page identity first (TB-2093): the hub leads with title, lead, and actions.
 * The former "About alert rules" / "About alert configuration" disclosures are gone —
 * orientation copy now lives behind the single contextual help entry point in the header.
 */
function alertRulesHubActiveTabLabel(tabId: AlertRulesHubTabId): string {
  return TAB_CONFIG[tabId].label;
}

function AlertRulesHubChrome(props: { readonly activeTab: AlertRulesHubTabId }): React.JSX.Element {
  const {
    refreshing,
    lastRefreshedAt,
    requestRefresh,
    tabCounts,
    rulesConfigChange,
    compositeRulesConfigChange,
  } = useAlertRulesHubRefresh();

  return (
    <>
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(isBuyerPolishedOperatorShellEnv())}
        activeTab={props.activeTab}
        activeTabLabel={alertRulesHubActiveTabLabel(props.activeTab)}
        rulesTabCount={tabCounts.rules}
        rulesConfigChange={rulesConfigChange}
        advancedRulesTabCount={tabCounts["advanced-rules"]}
        compositeRulesConfigChange={compositeRulesConfigChange}
        refreshing={refreshing}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={requestRefresh}
      />
      <AlertRulesAlertsInboxVocabularyRail currentSurfaceId="alert-rules" />
    </>
  );
}

function AlertRulesHubTabPanel(props: {
  readonly tabId: AlertRulesHubTabId;
}): React.JSX.Element {
  return (
    <>
      {props.tabId === "rules" ? <AlertRulesContentDeferred /> : null}
      {props.tabId === "notifications" ? <AlertRoutingContentDeferred /> : null}
      {props.tabId === "advanced-rules" ? <CompositeAlertRulesContentDeferred /> : null}
      {props.tabId === "test-alerts" ? <AlertSimulationTuningSectionDeferred /> : null}
    </>
  );
}

function AlertRulesHubTabsList(): React.JSX.Element {
  const { tabCounts } = useAlertRulesHubRefresh();
  const rulesCount = tabCounts.rules ?? 0;
  const testAlertsDisabled = rulesCount === 0;
  const testAlertsDisabledReason = whyDisabledNeedsPrerequisite("at least one alert rule");

  return (
    <div className="space-y-1">
      <TabsList aria-label="Alerts configuration sections" className="mb-0">
        {ALERT_RULES_HUB_TAB_IDS.map((id) => {
          const disabled = id === "test-alerts" && testAlertsDisabled;

          return (
            <TabsTrigger
              key={id}
              value={id}
              disabled={disabled}
              aria-describedby={disabled ? "alert-rules-test-alerts-disabled-hint" : undefined}
              data-testid={`alert-rules-hub-tab-${id}`}
            >
              {alertRulesHubTabLabel(id, tabCounts[id])}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {testAlertsDisabled ? (
        <WhyDisabledCtaHint
          id="alert-rules-test-alerts-disabled-hint"
          testId="alert-rules-test-alerts-disabled-hint"
          reason={testAlertsDisabledReason}
        />
      ) : null}
    </div>
  );
}

/**
 * Alert configuration hub — separate from the Alert inbox triage surface.
 */
export function AlertRulesHubClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get(ALERT_RULES_HUB_TAB_PARAM);
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const [activeTab, setActiveTab] = useState<AlertRulesHubTabId>(() =>
    alertRulesHubTabFromSearchParam(tabParam),
  );

  useEffect(() => {
    const fromSearchParams = alertRulesHubTabFromSearchParam(tabParam);

    setActiveTab((current) => (current === fromSearchParams ? current : fromSearchParams));
  }, [tabParam]);

  useEffect(() => {
    const onPopState = (): void => {
      setActiveTab(readAlertRulesHubTabFromWindowLocation());
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return (
    <AlertRulesHubRefreshProvider activeTab={activeTab}>
      <AlertRulesHubTabCountsBootstrap />
      <AlertRulesHubTabShell
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        scopedRunId={scopedRunId}
      />
    </AlertRulesHubRefreshProvider>
  );
}

function AlertRulesHubTabShell(props: {
  readonly activeTab: AlertRulesHubTabId;
  readonly onActiveTabChange: (tab: AlertRulesHubTabId) => void;
  readonly scopedRunId: string;
}): React.JSX.Element {
  const { tabCounts } = useAlertRulesHubRefresh();
  const rulesCount = tabCounts.rules ?? 0;

  useEffect(() => {
    if (props.activeTab === "test-alerts" && rulesCount === 0) {
      props.onActiveTabChange("rules");
      writeAlertRulesHubTabToUrl("rules", props.scopedRunId);
    }
  }, [props.activeTab, props.onActiveTabChange, props.scopedRunId, rulesCount]);

  const onSelectTab = useCallback(
    (id: string) => {
      const nextTab = alertRulesHubTabFromSearchParam(id);

      if (nextTab === "test-alerts" && rulesCount === 0) {
        return;
      }

      props.onActiveTabChange(nextTab);
      writeAlertRulesHubTabToUrl(nextTab, props.scopedRunId);
    },
    [props.onActiveTabChange, props.scopedRunId, rulesCount],
  );

  return (
    <div className="px-0">
      <AlertRulesHubChrome activeTab={props.activeTab} />

      <Tabs value={props.activeTab} onValueChange={onSelectTab} variant="line">
          <AlertRulesHubTabsList />

          {ALERT_RULES_HUB_TAB_IDS.map((id) => (
            <TabsContent
              key={id}
              value={id}
              className="min-w-0 pt-0"
              data-testid="alert-rules-hub-panel"
            >
              <AlertRulesHubTabPanel tabId={id} />
            </TabsContent>
          ))}
        </Tabs>
    </div>
  );
}
