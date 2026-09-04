"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import {
  useAlertRoutingSubscriptionsQuery,
  useAlertRulesListQuery,
} from "@/components/alerts/use-alert-rules-hub-queries";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { governanceAlertRulesTabHref, GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { latestAlertRulesConfigChange } from "@/lib/alert-rules-config-change";
import {
  ALERT_RULES_LIST_EMPTY_BODY,
  ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED,
  ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL,
  ALERT_RULES_STATUS_LIVE_REGION_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";
import type { AlertRule } from "@/types/alerts";
import {
  resolveContinueLastAlertRule,
  writeAlertRuleLastViewedId,
} from "@/lib/resolve-continue-last-alert-rule";
import {
  alertRulesSimulateRuleHrefFromSearch,
  parseAlertRulesSimulateRuleIdFromSearch,
} from "@/lib/alerts/alert-rules-simulate-rule-url";

export function useAlertRulesContentList() {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ALERT_RULES_PATH;
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReviewForCreating = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const canMutateAlertRules = useOperateCapability();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  const registerTabLoader = refreshContext?.registerTabLoader;
  const reportTabLoaded = refreshContext?.reportTabLoaded;
  const sampleModeBlocked: boolean =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canEdit: boolean = canMutateAlertRules && !sampleModeBlocked;
  const statusRegionId = useId();
  const didFocusEmptyIntroRef = useRef(false);

  const rulesQuery = useAlertRulesListQuery();
  const routingQuery = useAlertRoutingSubscriptionsQuery();
  const items = rulesQuery.items;
  const continueLastRule = useMemo(() => resolveContinueLastAlertRule(items), [items]);
  const routingSubscriptions = routingQuery.items;
  const loading = rulesQuery.loading;
  const listFailure = rulesQuery.failure;
  const [simulateForRule, setSimulateForRuleState] = useState<AlertRule | null>(null);

  const syncSimulateRuleToUrl = useCallback(
    (rule: AlertRule | null) => {
      router.replace(
        alertRulesSimulateRuleHrefFromSearch(
          searchParams.toString(),
          rule?.ruleId ?? null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSimulateForRule = useCallback(
    (rule: AlertRule | null) => {
      setSimulateForRuleState(rule);
      syncSimulateRuleToUrl(rule);
    },
    [syncSimulateRuleToUrl],
  );

  useEffect(() => {
    const simulateRuleId = parseAlertRulesSimulateRuleIdFromSearch(searchParams.get("simulateRule"));

    if (simulateRuleId.length === 0) {
      setSimulateForRuleState(null);

      return;
    }

    if (loading) {
      return;
    }

    const match = items.find((rule) => rule.ruleId === simulateRuleId);

    if (match === undefined) {
      return;
    }

    setSimulateForRuleState((current) => (current?.ruleId === match.ruleId ? current : match));
  }, [items, loading, searchParams]);

  function rememberRule(ruleId: string): void {
    writeAlertRuleLastViewedId(ruleId);
  }

  function openRule(ruleId: string): void {
    rememberRule(ruleId);
    const match = items.find((rule) => rule.ruleId === ruleId);

    if (match !== undefined) {
      setSimulateForRule(match);
    }

    document
      .querySelector(`[data-alert-rule-id="${ruleId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const load = useCallback(async () => {
    await Promise.all([rulesQuery.refresh(), routingQuery.refresh()]);
  }, [routingQuery, rulesQuery]);

  useEffect(() => {
    if (registerTabLoader === undefined) {
      return;
    }

    return registerTabLoader("rules", load);
  }, [load, registerTabLoader]);

  useEffect(() => {
    if (reportTabLoaded === undefined || loading || listFailure !== null) {
      return;
    }

    reportTabLoaded("rules", items.length, latestAlertRulesConfigChange(items));
  }, [items, listFailure, loading, reportTabLoaded]);

  const listInitialLoading = loading && items.length === 0;
  const isEmpty = items.length === 0;
  const showEmptyCard = !listInitialLoading && isEmpty;

  const emptyStateDescription = useMemo(() => {
    const externalNotificationsUnconfigured = routingSubscriptions.length === 0;

    return (
      <>
        <p className="m-0">{ALERT_RULES_LIST_EMPTY_BODY}</p>
        {externalNotificationsUnconfigured ? (
          <p className="m-0 mt-2">
            {ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED}{" "}
            <Link href={governanceAlertRulesTabHref("notifications")} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              {ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL}
            </Link>
          </p>
        ) : null}
      </>
    );
  }, [routingSubscriptions.length]);

  return {
    scopedRunId,
    scopedRunFilterActive,
    onPickReviewForCreating,
    canMutateAlertRules,
    canEdit,
    sampleModeBlocked,
    statusRegionId,
    statusRegionLabel: ALERT_RULES_STATUS_LIVE_REGION_LABEL,
    items,
    continueLastRule,
    routingSubscriptions,
    loading,
    listFailure,
    load,
    simulateForRule,
    setSimulateForRule,
    rememberRule,
    openRule,
    listInitialLoading,
    isEmpty,
    showEmptyCard,
    emptyStateDescription,
    didFocusEmptyIntroRef,
  };
}
