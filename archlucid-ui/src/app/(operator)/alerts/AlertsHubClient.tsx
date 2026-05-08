"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";
import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import { AlertSimulationTuningSection } from "@/components/alerts/AlertSimulationTuningSection";
import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";
import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";
import {
  ALERT_HUB_TAB_IDS,
  alertHubTabFromSearchParam,
  type AlertHubTabId,
} from "@/lib/alerts-hub-tab";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { cn } from "@/lib/utils";

const TAB_PARAM = "tab";

const ALERTS_HUB_ORIENT_DISMISS_KEY = "archlucid-alerts-hub-orient-v1-dismissed";

const TAB_LABEL: Record<AlertHubTabId, string> = {
  inbox: "Inbox",
  rules: "Rules",
  routing: "Routing",
  composite: "Composite",
  simulation: "Simulation & Tuning",
};

/** Tabs that contain credible sample data for buyer-facing demos. Config-heavy tabs are hidden. */
const BUYER_DEMO_TAB_ALLOWLIST = new Set<AlertHubTabId>(["inbox"]);

/**
 * Single `/alerts` surface: inbox, rules, routing, composite, and merged simulation + tuning.
 * Tab state is in the query string for deep links and browser history.
 */
export function AlertsHubClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get(TAB_PARAM);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [hubOrientVisible, setHubOrientVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setHubOrientVisible(window.localStorage.getItem(ALERTS_HUB_ORIENT_DISMISS_KEY) !== "1");
    } catch {
      setHubOrientVisible(true);
    }
  }, []);

  const dismissHubOrient = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(ALERTS_HUB_ORIENT_DISMISS_KEY, "1");
      } catch {
        /* ignore quota / private mode */
      }
    }

    setHubOrientVisible(false);
  }, []);

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

      router.push(`${pathname}?${TAB_PARAM}=${encodeURIComponent(id)}`);
    },
    [pathname, router],
  );

  return (
    <div className="px-0">
      {hubOrientVisible && !buyerPolishedShell ? (
        <div
          className="mb-4 flex flex-col gap-2 rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-sm text-neutral-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-neutral-100 sm:flex-row sm:items-start sm:justify-between"
          role="region"
          aria-label="Alerts hub quick start"
        >
          <div className="min-w-0 space-y-1">
            <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-50">Alerts — where to start</p>
            <ol className="m-0 list-decimal space-y-1 pl-5 text-neutral-700 dark:text-neutral-200">
              <li>
                Triage in <strong>Inbox</strong> (what is open now).
              </li>
              <li>
                Adjust signal logic in <strong>Rules</strong>, then wire delivery in <strong>Routing</strong>.
              </li>
              <li>
                Use <strong>Simulation & Tuning</strong> before turning loud rules on in production.
              </li>
            </ol>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            onClick={dismissHubOrient}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {visibleTabIds.length > 1 ? (
      <nav
        className="mb-6 border-b border-neutral-200 dark:border-neutral-800"
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
                  "rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium",
                  selected
                    ? "border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
                    : "border-transparent bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900",
                )}
              >
                {TAB_LABEL[id]}
              </button>
            );
          })}
        </div>
      </nav>
      ) : null}

      <p className="mb-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        {buyerPolishedShell
          ? "Open items tie risk signals to findings in this workspace so reviewers can triage and close the loop."
          : (
          <>
            Inbox and rules evaluate signals against{" "}
            <GlossaryTooltip termKey="effective_governance">effective governance</GlossaryTooltip> and persisted findings —
            escalation paths are tenant-specific.
          </>
            )}
      </p>

      <div
        className="min-w-0"
        role="tabpanel"
        aria-labelledby={visibleTabIds.length > 1 ? `alert-hub-tab-${activeTab}` : undefined}
        aria-label={visibleTabIds.length > 1 ? undefined : "Alert inbox"}
        data-testid="alert-hub-panel"
      >
        {activeTab === "inbox" ? <AlertsInboxContent /> : null}
        {activeTab === "rules" ? <AlertRulesContent /> : null}
        {activeTab === "routing" ? <AlertRoutingContent /> : null}
        {activeTab === "composite" ? <CompositeAlertRulesContent /> : null}
        {activeTab === "simulation" ? <AlertSimulationTuningSection /> : null}
      </div>
    </div>
  );
}
