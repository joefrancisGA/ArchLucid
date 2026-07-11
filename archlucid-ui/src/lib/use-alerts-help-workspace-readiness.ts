"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listAlertRules,
  listAlertRoutingSubscriptions,
  listAlertsPaged,
  listCompositeAlertRules,
} from "@/lib/api";
import {
  ALERTS_SUMMARY_LAST_EVALUATED_NEVER,
  ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED,
} from "@/lib/alerts-page-copy";
import { resolveLastEvaluatedUtc } from "@/lib/alerts-inbox-summary";
import { formatRelativeTime } from "@/lib/relative-time";

export type AlertsHelpWorkspaceReadinessSnapshot = {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly enabledRulesLabel: string;
  readonly openAlertsLabel: string;
  readonly routingDestinationsLabel: string;
  readonly lastEvaluationLabel: string;
};

const INITIAL_SNAPSHOT: AlertsHelpWorkspaceReadinessSnapshot = {
  loading: true,
  loadFailed: false,
  enabledRulesLabel: "…",
  openAlertsLabel: "…",
  routingDestinationsLabel: "…",
  lastEvaluationLabel: "…",
};

function formatEnabledRulesLabel(enabledCount: number): string {
  if (enabledCount === 1) {
    return "1 enabled rule";
  }

  return `${enabledCount} enabled rules`;
}

function formatOpenAlertsLabel(openCount: number): string {
  if (openCount === 0) {
    return "No open alerts";
  }

  if (openCount === 1) {
    return "1 open alert";
  }

  return `${openCount} open alerts`;
}

function formatRoutingDestinationsLabel(enabledDestinationCount: number): string {
  if (enabledDestinationCount === 0) {
    return "No routing configured";
  }

  if (enabledDestinationCount === 1) {
    return "1 routing destination";
  }

  return `${enabledDestinationCount} routing destinations`;
}

function formatLastEvaluationLabel(
  hasEnabledRules: boolean,
  lastEvaluatedUtc: string | null,
): string {
  if (!hasEnabledRules) {
    return ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED;
  }

  if (lastEvaluatedUtc === null) {
    return ALERTS_SUMMARY_LAST_EVALUATED_NEVER;
  }

  return formatRelativeTime(lastEvaluatedUtc);
}

export function useAlertsHelpWorkspaceReadiness(): AlertsHelpWorkspaceReadinessSnapshot {
  const [snapshot, setSnapshot] = useState<AlertsHelpWorkspaceReadinessSnapshot>(INITIAL_SNAPSHOT);

  const load = useCallback(async (): Promise<void> => {
    setSnapshot((prev) => ({ ...prev, loading: true, loadFailed: false }));

    try {
      const [simpleRules, compositeRules, routingSubscriptions, openAlertsPage, recentAlertsPage] =
        await Promise.all([
          listAlertRules(),
          listCompositeAlertRules(),
          listAlertRoutingSubscriptions(),
          listAlertsPaged("Open", 1, 1),
          listAlertsPaged(null, 1, 1),
        ]);

      const enabledRulesCount =
        simpleRules.filter((rule) => rule.isEnabled).length
        + compositeRules.filter((rule) => rule.isEnabled).length;
      const enabledRoutingCount = routingSubscriptions.filter((row) => row.isEnabled).length;
      const lastEvaluatedUtc = resolveLastEvaluatedUtc(recentAlertsPage.items);

      setSnapshot({
        loading: false,
        loadFailed: false,
        enabledRulesLabel: formatEnabledRulesLabel(enabledRulesCount),
        openAlertsLabel: formatOpenAlertsLabel(openAlertsPage.totalCount),
        routingDestinationsLabel: formatRoutingDestinationsLabel(enabledRoutingCount),
        lastEvaluationLabel: formatLastEvaluationLabel(enabledRulesCount > 0, lastEvaluatedUtc),
      });
    } catch {
      setSnapshot({
        loading: false,
        loadFailed: true,
        enabledRulesLabel: "Unavailable",
        openAlertsLabel: "Unavailable",
        routingDestinationsLabel: "Unavailable",
        lastEvaluationLabel: "Not yet evaluated",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return snapshot;
}
