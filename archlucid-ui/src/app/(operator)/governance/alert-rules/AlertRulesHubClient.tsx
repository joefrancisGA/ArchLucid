"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AlertRulesAlertsInboxVocabularyRail } from "@/components/AlertRulesAlertsInboxVocabularyRail";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/GovernanceSetupConfigHubsVocabularyRail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ALERT_RULES_HUB_TAB_IDS,
  alertRulesHubTabFromSearchParam,
  type AlertRulesHubTabId,
} from "@/lib/alerts-hub-tab";
import { alertsConfigurationPageSubtitle } from "@/lib/alerts-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
    <>
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(isBuyerPolishedOperatorShellEnv())}
        refreshing={refreshing}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={requestRefresh}
      />
      <AlertRulesAlertsInboxVocabularyRail currentSurfaceId="alert-rules" />
      <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="alert-rules" />
    </>
  );
}

function AlertRulesHubTabPanel(props: {
  readonly tabId: AlertRulesHubTabId;
  readonly subtitle: string;
}): React.JSX.Element {
  return (
    <>
      <p
        className={cn("m-0 mb-6 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid={`alert-rules-hub-tab-lead-${props.tabId}`}
      >
        {props.subtitle}
      </p>
      {props.tabId === "rules" ? <AlertRulesContentDeferred /> : null}
      {props.tabId === "notifications" ? <AlertRoutingContentDeferred /> : null}
      {props.tabId === "advanced-rules" ? <CompositeAlertRulesContentDeferred /> : null}
      {props.tabId === "test-alerts" ? <AlertSimulationTuningSectionDeferred /> : null}
    </>
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
        <AlertRulesHubChrome />

        <Tabs value={activeTab} onValueChange={onSelectTab} variant="line">
          <TabsList aria-label="Alerts configuration sections" className="mb-0">
            {ALERT_RULES_HUB_TAB_IDS.map((id) => (
              <TabsTrigger
                key={id}
                value={id}
                data-testid={`alert-rules-hub-tab-${id}`}
              >
                {TAB_CONFIG[id].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ALERT_RULES_HUB_TAB_IDS.map((id) => (
            <TabsContent
              key={id}
              value={id}
              className="min-w-0 pt-0"
              data-testid="alert-rules-hub-panel"
            >
              <AlertRulesHubTabPanel tabId={id} subtitle={TAB_CONFIG[id].subtitle} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AlertRulesHubRefreshProvider>
  );
}
