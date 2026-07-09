"use client";



import { cn } from "@/lib/utils";

import { useCallback, useMemo } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";



import { AlertsGovernanceContextPanel } from "@/components/alerts/AlertsGovernanceContextPanel";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";

import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";

import { AlertSimulationTuningSection } from "@/components/alerts/AlertSimulationTuningSection";

import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";

import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";

import { useOperateCapability } from "@/hooks/use-operate-capability";

import {

  ALERT_HUB_TAB_IDS,

  alertHubTabFromSearchParam,

  type AlertHubTabId,

} from "@/lib/alerts-hub-tab";

import { ALERTS_PAGE_SUBTITLE, ALERTS_HUB_TAB_STANDARDS_AND_RULES } from "@/lib/alerts-page-copy";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { governanceAlertsTabHref } from "@/lib/governance-route-paths";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";



import type { AlertsInboxPageModel } from "./_sections/alerts-inbox-page-model";



const TAB_PARAM = "tab";



const TAB_LABEL: Record<AlertHubTabId, string> = {

  inbox: "Inbox",

  rules: ALERTS_HUB_TAB_STANDARDS_AND_RULES,

  routing: "Routing",

  composite: "Composite",

  simulation: "Simulation & Tuning",

};



/** Tabs that contain credible sample data for buyer-facing demos. Config-heavy tabs are hidden. */

const BUYER_DEMO_TAB_ALLOWLIST = new Set<AlertHubTabId>(["inbox"]);



export type AlertsHubClientProps = {

  readonly initialInboxModel?: AlertsInboxPageModel | null;

};



/**

 * Single `/alerts` surface: inbox, rules, routing, composite, and merged simulation + tuning.

 * Tab state is in the query string for deep links and browser history.

 */

export function AlertsHubClient({ initialInboxModel = null }: AlertsHubClientProps = {}) {

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const rawTab = searchParams.get(TAB_PARAM);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const canMutateAlertInbox = useOperateCapability();



  const visibleTabIds = useMemo(

    () => (buyerPolishedShell ? ALERT_HUB_TAB_IDS.filter((id) => BUYER_DEMO_TAB_ALLOWLIST.has(id)) : ALERT_HUB_TAB_IDS),

    [buyerPolishedShell],

  );



  const activeTab: AlertHubTabId = useMemo(

    () => {

      const parsed = alertHubTabFromSearchParam(rawTab);

      return buyerPolishedShell && !BUYER_DEMO_TAB_ALLOWLIST.has(parsed) ? "inbox" : parsed;

    },

    [rawTab, buyerPolishedShell],

  );



  const onSelectTab = useCallback(

    (id: AlertHubTabId) => {

      if (id === "inbox") {

        router.push(pathname);

        return;

      }



      router.push(governanceAlertsTabHref(id));

    },

    [pathname, router],

  );



  return (

    <div className="px-0">

      <OperatorPageHeader

        title={OPERATOR_NAV_LINK_LABELS.alerts}

        subtitle={ALERTS_PAGE_SUBTITLE}

        titleTestId="alerts-page-title"

      >

        {activeTab === "inbox" ? (

          <AlertsGovernanceContextPanel canMutateAlertInbox={canMutateAlertInbox} />

        ) : null}

      </OperatorPageHeader>



      {visibleTabIds.length > 1 ? (

      <nav

        className="mb-4 border-b border-neutral-200 dark:border-neutral-800"

        aria-label="Alert hub sections"

      >

        <div className="-mb-px flex flex-wrap gap-1" role="tablist">

          {visibleTabIds.map((id) => {

            const selected = activeTab === id;



            return (

              <button

                key={id}

                type="button"

                role="tab"

                aria-selected={selected}

                id={`alert-hub-tab-${id}`}

                data-testid={`alert-hub-tab-${id}`}

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

      ) : null}



      <div

        className="min-w-0"

        role="tabpanel"

        aria-labelledby={visibleTabIds.length > 1 ? `alert-hub-tab-${activeTab}` : undefined}

        aria-label={visibleTabIds.length > 1 ? undefined : "Alert inbox"}

        data-testid="alert-hub-panel"

      >

        {activeTab === "inbox" ? <AlertsInboxContent initialModel={initialInboxModel} /> : null}

        {activeTab === "rules" ? <AlertRulesContent /> : null}

        {activeTab === "routing" ? <AlertRoutingContent /> : null}

        {activeTab === "composite" ? <CompositeAlertRulesContent /> : null}

        {activeTab === "simulation" ? <AlertSimulationTuningSection /> : null}

      </div>

    </div>

  );

}

