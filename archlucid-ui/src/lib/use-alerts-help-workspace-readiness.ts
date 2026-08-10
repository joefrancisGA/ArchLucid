"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listAlertRules,
  listAlertRoutingSubscriptions,
  listAlertsPaged,
  listCompositeAlertRules,
} from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NONE,
  ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NO_RULES,
} from "@/lib/alerts-help-guide-content";
import { resolveLastEvaluatedUtc } from "@/lib/alerts-inbox-summary";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";

export const ALERTS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL = "This workspace";

export type AlertsHelpWorkspaceReadinessSnapshot = {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly loadForbidden: boolean;
  readonly enabledRulesCount: number;
  readonly enabledRulesLabel: string;
  readonly enabledRulesStatusKind: EnterpriseStatusKind;
  readonly openAlertsLabel: string;
  readonly openAlertsStatusKind: EnterpriseStatusKind;
  readonly routingDestinationsLabel: string;
  readonly routingDestinationsStatusKind: EnterpriseStatusKind;
  readonly lastEvaluationLabel: string;
  readonly lastEvaluationStatusKind: EnterpriseStatusKind;
  readonly workspaceScopeLabel: string | null;
  readonly loadedAtUtc: string | null;
  readonly reload: () => void;
};

const INITIAL_SNAPSHOT: Omit<AlertsHelpWorkspaceReadinessSnapshot, "reload"> = {
  loading: true,
  loadFailed: false,
  loadForbidden: false,
  enabledRulesCount: 0,
  enabledRulesLabel: "…",
  enabledRulesStatusKind: "neutral",
  openAlertsLabel: "…",
  openAlertsStatusKind: "neutral",
  routingDestinationsLabel: "…",
  routingDestinationsStatusKind: "neutral",
  lastEvaluationLabel: "…",
  lastEvaluationStatusKind: "neutral",
  workspaceScopeLabel: null,
  loadedAtUtc: null,
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

function formatRecentAlertActivityLabel(
  hasEnabledRules: boolean,
  lastActivityUtc: string | null,
): string {
  if (!hasEnabledRules) {
    return ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NO_RULES;
  }

  if (lastActivityUtc === null) {
    return ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NONE;
  }

  return formatRelativeTime(lastActivityUtc);
}

function resolveEnabledRulesStatusKind(enabledCount: number): EnterpriseStatusKind {
  if (enabledCount === 0) {
    return "needs-attention";
  }

  return "ready";
}

function resolveOpenAlertsStatusKind(openCount: number): EnterpriseStatusKind {
  if (openCount === 0) {
    return "neutral";
  }

  return "needs-attention";
}

function resolveRoutingDestinationsStatusKind(enabledDestinationCount: number): EnterpriseStatusKind {
  if (enabledDestinationCount === 0) {
    return "needs-attention";
  }

  return "ready";
}

function resolveRecentAlertActivityStatusKind(
  hasEnabledRules: boolean,
  lastActivityUtc: string | null,
): EnterpriseStatusKind {
  if (!hasEnabledRules) {
    return "needs-attention";
  }

  if (lastActivityUtc === null) {
    return "neutral";
  }

  return "ready";
}

function isAuthorizationFailure(error: unknown): boolean {
  return isApiRequestError(error) && (error.httpStatus === 401 || error.httpStatus === 403);
}

export function useAlertsHelpWorkspaceReadiness(): AlertsHelpWorkspaceReadinessSnapshot {
  const [snapshot, setSnapshot] = useState<Omit<AlertsHelpWorkspaceReadinessSnapshot, "reload">>(
    INITIAL_SNAPSHOT,
  );

  const load = useCallback(async (): Promise<void> => {
    setSnapshot((prev) => ({
      ...prev,
      loading: true,
      loadFailed: false,
      loadForbidden: false,
      workspaceScopeLabel: null,
    }));

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
      const lastActivityUtc = resolveLastEvaluatedUtc(recentAlertsPage.items);
      const hasEnabledRules = enabledRulesCount > 0;

      setSnapshot({
        loading: false,
        loadFailed: false,
        loadForbidden: false,
        enabledRulesCount,
        enabledRulesLabel: formatEnabledRulesLabel(enabledRulesCount),
        enabledRulesStatusKind: resolveEnabledRulesStatusKind(enabledRulesCount),
        openAlertsLabel: formatOpenAlertsLabel(openAlertsPage.totalCount),
        openAlertsStatusKind: resolveOpenAlertsStatusKind(openAlertsPage.totalCount),
        routingDestinationsLabel: formatRoutingDestinationsLabel(enabledRoutingCount),
        routingDestinationsStatusKind: resolveRoutingDestinationsStatusKind(enabledRoutingCount),
        lastEvaluationLabel: formatRecentAlertActivityLabel(hasEnabledRules, lastActivityUtc),
        lastEvaluationStatusKind: resolveRecentAlertActivityStatusKind(hasEnabledRules, lastActivityUtc),
        workspaceScopeLabel: ALERTS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
        loadedAtUtc: new Date().toISOString(),
      });
    } catch (error) {
      if (isAuthorizationFailure(error)) {
        setSnapshot({
          loading: false,
          loadFailed: false,
          loadForbidden: true,
          enabledRulesCount: 0,
          enabledRulesLabel: "",
          enabledRulesStatusKind: "neutral",
          openAlertsLabel: "",
          openAlertsStatusKind: "neutral",
          routingDestinationsLabel: "",
          routingDestinationsStatusKind: "neutral",
          lastEvaluationLabel: "",
          lastEvaluationStatusKind: "neutral",
          workspaceScopeLabel: null,
          loadedAtUtc: new Date().toISOString(),
        });

        return;
      }

      setSnapshot({
        loading: false,
        loadFailed: true,
        loadForbidden: false,
        enabledRulesCount: 0,
        enabledRulesLabel: "Unavailable",
        enabledRulesStatusKind: "blocked",
        openAlertsLabel: "Unavailable",
        openAlertsStatusKind: "blocked",
        routingDestinationsLabel: "Unavailable",
        routingDestinationsStatusKind: "blocked",
        lastEvaluationLabel: "Unavailable",
        lastEvaluationStatusKind: "blocked",
        workspaceScopeLabel: null,
        loadedAtUtc: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...snapshot,
    reload: load,
  };
}
