"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useAlertRoutingSubscriptionsQuery } from "@/components/alerts/use-alert-rules-hub-queries";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertRoutingDisableRouteHrefFromSearch,
  parseAlertRoutingDisableRouteIdFromSearch,
} from "@/lib/alerts/alert-routing-disable-route-url";
import {
  alertRoutingPageLeadOperator,
  alertRoutingPageLeadOperatorEmpty,
  alertRoutingPageLeadReader,
  alertRoutingPageLeadReaderEmpty,
} from "@/lib/enterprise-controls-context-copy";
import {
  formatAlertRoutingConfigProvenanceLine,
  summarizeAlertRoutingDeliveryHealth,
} from "@/lib/alert-routing-presentation";
import { latestAlertRoutingConfigChange } from "@/lib/alert-routing-config-change";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import {
  resolveContinueLastAlertRoutingSubscription,
  writeAlertRoutingSubscriptionLastViewedId,
} from "@/lib/resolve-continue-last-alert-routing-subscription";
import { listAlertRoutingDeliveryAttempts, toggleAlertRoutingSubscription } from "@/lib/api";
import type { AlertRoutingDeliveryAttempt } from "@/types/alert-routing";
import type { AlertRoutingSubscriptionDisableTarget } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";

export function useAlertRoutingList() {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ALERT_RULES_PATH;
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const urlDisableRouteId = parseAlertRoutingDisableRouteIdFromSearch(searchParams.get("disableRouteId"));
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReviewForRouting = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "notifications");
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const canMutateRouting = useOperateCapability();
  const sampleModeBlocked: boolean =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canEditRouting: boolean = canMutateRouting && !sampleModeBlocked;
  const routingQuery = useAlertRoutingSubscriptionsQuery();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  const reportTabLoadedRef = useRef(refreshContext?.reportTabLoaded);
  reportTabLoadedRef.current = refreshContext?.reportTabLoaded;
  const registerTabLoader = refreshContext?.registerTabLoader;
  const statusRegionId = useId();
  const items = routingQuery.items;
  const continueLastSubscription = useMemo(
    () => resolveContinueLastAlertRoutingSubscription(items),
    [items],
  );
  const loading = routingQuery.loading;
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const listFailure = routingQuery.failure ?? mutationFailure;
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, AlertRoutingDeliveryAttempt[]>>({});
  const [pendingDisable, setPendingDisableState] = useState<AlertRoutingSubscriptionDisableTarget | null>(null);
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableErrorMessage, setDisableErrorMessage] = useState<string | null>(null);

  const syncDisableRouteToUrl = useCallback(
    (routingSubscriptionId: string | null) => {
      router.replace(
        alertRoutingDisableRouteHrefFromSearch(searchParams.toString(), routingSubscriptionId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingDisable = useCallback(
    (value: AlertRoutingSubscriptionDisableTarget | null) => {
      setPendingDisableState(value);
      syncDisableRouteToUrl(value?.routingSubscriptionId ?? null);
    },
    [syncDisableRouteToUrl],
  );

  useEffect(() => {
    if (urlDisableRouteId.length === 0) {
      if (pendingDisable !== null) {
        setPendingDisableState(null);
      }

      return;
    }

    if (items.length === 0) {
      return;
    }

    const subscription = items.find((row) => row.routingSubscriptionId === urlDisableRouteId);

    if (subscription === undefined) {
      return;
    }

    if (pendingDisable?.routingSubscriptionId === urlDisableRouteId) {
      return;
    }

    setPendingDisableState({
      routingSubscriptionId: subscription.routingSubscriptionId,
      subscriptionName: subscription.name,
      channel: subscription.channelType === "SlackWebhook" ? "slack" : "webhook",
    });
  }, [items, pendingDisable?.routingSubscriptionId, urlDisableRouteId]);

  const pageLead = useMemo(() => {
    if (items.length === 0) {
      return canMutateRouting ? alertRoutingPageLeadOperatorEmpty : alertRoutingPageLeadReaderEmpty;
    }

    return canMutateRouting ? alertRoutingPageLeadOperator : alertRoutingPageLeadReader;
  }, [canMutateRouting, items.length]);

  const deliveryHealth = useMemo(() => summarizeAlertRoutingDeliveryHealth(items), [items]);
  const isEmptyComposition: boolean = !loading && items.length === 0;

  const configProvenanceLabel = useMemo(() => {
    const change = latestAlertRoutingConfigChange(items);

    if (change === null) {
      return null;
    }

    return formatAlertRoutingConfigProvenanceLine(change.recordedUtc, change.actor);
  }, [items]);

  const refreshRoutingTab = useCallback(async () => {
    await routingQuery.refresh();
  }, [routingQuery.refresh]);

  useEffect(() => {
    if (registerTabLoader === undefined) {
      return;
    }

    return registerTabLoader("notifications", refreshRoutingTab);
  }, [refreshRoutingTab, registerTabLoader]);

  useEffect(() => {
    if (loading || routingQuery.failure !== null) {
      return;
    }

    reportTabLoadedRef.current?.("notifications", items.length);
  }, [items.length, loading, routingQuery.failure]);

  async function executeToggle(id: string): Promise<void> {
    setMutationFailure(null);
    writeAlertRoutingSubscriptionLastViewedId(id);

    try {
      await toggleAlertRoutingSubscription(id);
      await routingQuery.refresh();
    } catch (e) {
      setMutationFailure(toApiLoadFailure(e));
      throw e;
    }
  }

  async function onToggle(
    id: string,
    isEnabled: boolean,
    subscriptionName: string,
    channelTypeValue: string,
  ) {
    if (!canEditRouting) {
      return;
    }

    if (isEnabled) {
      setDisableErrorMessage(null);
      setPendingDisable({
        routingSubscriptionId: id,
        subscriptionName,
        channel: channelTypeValue === "SlackWebhook" ? "slack" : "webhook",
      });

      return;
    }

    await executeToggle(id);
  }

  async function confirmDisableSubscription(): Promise<void> {
    if (pendingDisable === null || disableBusy) {
      return;
    }

    setDisableBusy(true);
    setDisableErrorMessage(null);

    try {
      await executeToggle(pendingDisable.routingSubscriptionId);
      setPendingDisable(null);
    } catch (error: unknown) {
      const apiFailure = toApiLoadFailure(error);
      setDisableErrorMessage(apiFailure.message);
    } finally {
      setDisableBusy(false);
    }
  }

  async function loadAttempts(routingSubscriptionId: string) {
    writeAlertRoutingSubscriptionLastViewedId(routingSubscriptionId);

    try {
      const rows = await listAlertRoutingDeliveryAttempts(routingSubscriptionId, 30);
      setAttemptsBySub((prev) => ({ ...prev, [routingSubscriptionId]: rows }));
    } catch {
      /* ignore */
    }
  }

  function openSubscription(subscriptionId: string): void {
    writeAlertRoutingSubscriptionLastViewedId(subscriptionId);
    document
      .querySelector(`[data-alert-routing-subscription-id="${subscriptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    void loadAttempts(subscriptionId);
  }

  function cancelDisableDialog(): void {
    if (!disableBusy) {
      setPendingDisable(null);
      setDisableErrorMessage(null);
    }
  }

  return {
    scopedRunId,
    scopedRunFilterActive,
    onPickReviewForRouting,
    canMutateRouting,
    canEditRouting,
    sampleModeBlocked,
    items,
    loading,
    listFailure,
    statusRegionId,
    pageLead,
    deliveryHealth,
    isEmptyComposition,
    configProvenanceLabel,
    continueLastSubscription,
    attemptsBySub,
    pendingDisable,
    disableBusy,
    disableErrorMessage,
    refreshRoutingTab,
    loadAttempts,
    onToggle,
    confirmDisableSubscription,
    openSubscription,
    cancelDisableDialog,
  };
}
