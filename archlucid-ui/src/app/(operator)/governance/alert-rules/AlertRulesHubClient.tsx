"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AlertRulesAlertsInboxVocabularyRail } from "@/components/AlertRulesAlertsInboxVocabularyRail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ALERT_RULES_HUB_TAB_IDS,
  alertRulesHubTabFromSearchParam,
  type AlertRulesHubTabId,
} from "@/lib/alerts-hub-tab";
import { ALERT_RULES_TAB_LABEL } from "@/lib/alert-rule-conditions-copy";
import { alertsConfigurationPageSubtitle } from "@/lib/alerts-page-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";

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
};

const TAB_CONFIG: Record<AlertRulesHubTabId, AlertRulesHubTabConfig> = {
  rules: {
    label: ALERT_RULES_TAB_LABEL,
  },
  notifications: {
    label: "Notifications",
  },
  "advanced-rules": {
    label: "Advanced rules",
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
function AlertRulesHubChrome(props: { readonly activeTab: AlertRulesHubTabId }): React.JSX.Element {
  const { refreshing, lastRefreshedAt, requestRefresh, tabCounts } = useAlertRulesHubRefresh();

  return (
    <>
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(isBuyerPolishedOperatorShellEnv())}
        activeTab={props.activeTab}
        rulesTabCount={tabCounts.rules}
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

  return (
    <TabsList aria-label="Alerts configuration sections" className="mb-0">
      {ALERT_RULES_HUB_TAB_IDS.map((id) => (
        <TabsTrigger
          key={id}
          value={id}
          data-testid={`alert-rules-hub-tab-${id}`}
        >
          {alertRulesHubTabLabel(id, tabCounts[id])}
        </TabsTrigger>
      ))}
    </TabsList>
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
    (id: string) => {
      router.push(governanceAlertRulesTabHref(id));
    },
    [router],
  );

  return (
    <AlertRulesHubRefreshProvider activeTab={activeTab}>
      <div className="px-0">
        <AlertRulesHubChrome activeTab={activeTab} />

        <Tabs value={activeTab} onValueChange={onSelectTab} variant="line">
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
    </AlertRulesHubRefreshProvider>
  );
}
