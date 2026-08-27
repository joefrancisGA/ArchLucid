"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useAlertRoutingSubscriptionsQuery } from "@/components/alerts/use-alert-rules-hub-queries";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertRoutingPageLeadOperator,
  alertRoutingPageLeadOperatorEmpty,
  alertRoutingPageLeadReader,
  alertRoutingPageLeadReaderEmpty,
} from "@/lib/enterprise-controls-context-copy";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import {
  EMPTY_ALERT_ROUTING_CRITERIA,
  type AlertRoutingCriteria,
} from "@/lib/alert-routing-criteria";
import {
  formatAlertRoutingThresholdPreview,
  isAlertRoutingDestinationFormValid,
  isWebhookChannelType,
  type AlertRoutingFieldErrors,
  validateAlertRoutingDestination,
  validateAlertRoutingName,
} from "@/lib/alert-routing-form";
import {
  resolveAlertRoutingCreateEmphasizedStepId,
  resolveAlertRoutingCreateSteps,
} from "@/lib/alert-routing-create-checklist";
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
import {
  createAlertRoutingSubscription,
  listAlertRoutingDeliveryAttempts,
  testWebhookSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";
import type { AlertRoutingDeliveryAttempt } from "@/types/alert-routing";
import type { AlertRoutingSubscriptionDisableTarget } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";

export function useAlertRoutingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
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
  const formSectionRef = useRef<HTMLElement | null>(null);
  const statusRegionId = useId();
  const items = routingQuery.items;
  const continueLastSubscription = useMemo(
    () => resolveContinueLastAlertRoutingSubscription(items),
    [items],
  );
  const loading = routingQuery.loading;
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const failure = routingQuery.failure ?? mutationFailure;
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, AlertRoutingDeliveryAttempt[]>>({});
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AlertRoutingFieldErrors>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pendingDisable, setPendingDisable] = useState<AlertRoutingSubscriptionDisableTarget | null>(null);
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableErrorMessage, setDisableErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState("Email");
  const [destination, setDestination] = useState("");
  const [minimumSeverity, setMinimumSeverity] = useState("High");
  const [routingCriteria, setRoutingCriteria] = useState<AlertRoutingCriteria>(EMPTY_ALERT_ROUTING_CRITERIA);

  const formValid = useMemo(
    () => isAlertRoutingDestinationFormValid(channelType, name, destination),
    [channelType, destination, name],
  );
  const alertRoutingCreateSteps = resolveAlertRoutingCreateSteps({
    channelConfigured: channelType.trim().length > 0,
    destinationConfigured: formValid,
    destinationSaved: items.length > 0,
  });
  const alertRoutingCreateEmphasizedStepId = resolveAlertRoutingCreateEmphasizedStepId({
    channelConfigured: channelType.trim().length > 0,
    destinationConfigured: formValid,
    destinationSaved: items.length > 0,
  });

  const thresholdPreview = useMemo(
    () => formatAlertRoutingThresholdPreview(minimumSeverity, routingCriteria.severities),
    [minimumSeverity, routingCriteria.severities],
  );

  const pageLead = useMemo(() => {
    if (items.length === 0) {
      return canMutateRouting ? alertRoutingPageLeadOperatorEmpty : alertRoutingPageLeadReaderEmpty;
    }

    return canMutateRouting ? alertRoutingPageLeadOperator : alertRoutingPageLeadReader;
  }, [canMutateRouting, items.length]);

  const deliveryHealth = useMemo(() => summarizeAlertRoutingDeliveryHealth(items), [items]);
  const isEmptyComposition: boolean = !loading && items.length === 0;
  const mutationDisabledReason = canMutateRouting ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "alert-routing-mutate-disabled-hint";

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

  function scrollToForm() {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formSectionRef.current?.focus();
  }

  function validateForm(): boolean {
    const nextErrors: AlertRoutingFieldErrors = {};
    const nameError = validateAlertRoutingName(name);
    const destinationError = validateAlertRoutingDestination(channelType, destination);

    if (nameError !== null) {
      nextErrors.name = nameError;
    }

    if (destinationError !== null) {
      nextErrors.destination = destinationError;
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function onCreate(sendTestAfterSave: boolean) {
    if (!canEditRouting || creating) {
      return;
    }

    if (!validateForm()) {
      setStatusMessage("Fix the highlighted fields before saving.");

      return;
    }

    setCreating(true);
    setMutationFailure(null);
    setStatusMessage(sendTestAfterSave ? "Creating destination and sending test notification…" : "Creating destination…");

    try {
      const created = await createAlertRoutingSubscription({
        name: name.trim(),
        channelType,
        destination: destination.trim(),
        minimumSeverity,
        isEnabled: true,
        routingCriteria: {
          severities: routingCriteria.severities,
          findingTypes: routingCriteria.findingTypes,
          tags: routingCriteria.tags,
        },
      });

      if (sendTestAfterSave && isWebhookChannelType(channelType)) {
        const result = await testWebhookSubscription(created.routingSubscriptionId);
        presentWebhookConnectionTestToasts(result);
      }

      setRoutingCriteria({ ...EMPTY_ALERT_ROUTING_CRITERIA });
      setDestination("");
      setName("");
      setMinimumSeverity("High");
      setFieldErrors({});
      writeAlertRoutingSubscriptionLastViewedId(created.routingSubscriptionId);
      setStatusMessage("Notification destination created.");
      await routingQuery.refresh();
    } catch (e) {
      setMutationFailure(toApiLoadFailure(e));
      setStatusMessage("Could not create the notification destination.");
    } finally {
      setCreating(false);
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

  async function onTest(routingSubscriptionId: string) {
    if (testingId !== null) {
      return;
    }

    writeAlertRoutingSubscriptionLastViewedId(routingSubscriptionId);
    setTestingId(routingSubscriptionId);
    try {
      const result = await testWebhookSubscription(routingSubscriptionId);
      presentWebhookConnectionTestToasts(result);
    } catch (e) {
      presentWebhookConnectionTestRequestFailure(e);
    } finally {
      setTestingId(null);
    }
  }

  function openSubscription(subscriptionId: string): void {
    writeAlertRoutingSubscriptionLastViewedId(subscriptionId);
    document
      .querySelector(`[data-alert-routing-subscription-id="${subscriptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    void loadAttempts(subscriptionId);
  }

  function resetCreateForm(): void {
    setName("");
    setChannelType("Email");
    setDestination("");
    setMinimumSeverity("High");
    setRoutingCriteria({ ...EMPTY_ALERT_ROUTING_CRITERIA });
    setFieldErrors({});
    setStatusMessage("Form reset.");
  }

  function onChannelTypeChange(value: string): void {
    setChannelType(value);
    setDestination("");
    setFieldErrors((prev) => ({ ...prev, destination: undefined }));
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
    failure,
    statusRegionId,
    statusMessage,
    pageLead,
    deliveryHealth,
    isEmptyComposition,
    configProvenanceLabel,
    continueLastSubscription,
    attemptsBySub,
    testingId,
    pendingDisable,
    disableBusy,
    disableErrorMessage,
    formSectionRef,
    creating,
    formValid,
    name,
    channelType,
    destination,
    minimumSeverity,
    routingCriteria,
    fieldErrors,
    thresholdPreview,
    alertRoutingCreateSteps,
    alertRoutingCreateEmphasizedStepId,
    mutationDisabledReason,
    mutationDisabledHintId,
    setName,
    onChannelTypeChange,
    setDestination,
    setMinimumSeverity,
    setRoutingCriteria,
    scrollToForm,
    onCreate,
    onToggle,
    loadAttempts,
    onTest,
    openSubscription,
    resetCreateForm,
    confirmDisableSubscription,
    cancelDisableDialog,
  };
}

export type UseAlertRoutingContentResult = ReturnType<typeof useAlertRoutingContent>;
