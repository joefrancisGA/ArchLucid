"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { createAlertRoutingSubscription, testWebhookSubscription } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";
import { writeAlertRoutingSubscriptionLastViewedId } from "@/lib/resolve-continue-last-alert-routing-subscription";
import {
  compositeAlertRulesPanelsHrefFromSearch,
  parseCompositeAlertRulesCreatePanelFromSearch,
} from "@/lib/alerts/composite-alert-rules-panels-url";
import type { useAlertRoutingList } from "@/components/alerts/use-alert-routing-list";

export type UseAlertRoutingCreateArgs = {
  readonly list: Pick<
    ReturnType<typeof useAlertRoutingList>,
    "canEditRouting" | "canMutateRouting" | "items" | "listFailure" | "refreshRoutingTab" | "scopedRunFilterActive"
  >;
};

export function useAlertRoutingCreate(args: UseAlertRoutingCreateArgs) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlShowCreate = parseCompositeAlertRulesCreatePanelFromSearch(searchParams.get("create"));
  const formSectionRef = useRef<HTMLElement | null>(null);
  const [creating, setCreating] = useState(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AlertRoutingFieldErrors>({});
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState("Email");
  const [destination, setDestination] = useState("");
  const [minimumSeverity, setMinimumSeverity] = useState("High");
  const [routingCriteria, setRoutingCriteria] = useState<AlertRoutingCriteria>(EMPTY_ALERT_ROUTING_CRITERIA);
  const mutationDisabledReason = args.list.canMutateRouting ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "alert-routing-mutate-disabled-hint";

  const formValid = useMemo(
    () => isAlertRoutingDestinationFormValid(channelType, name, destination),
    [channelType, destination, name],
  );
  const alertRoutingCreateSteps = resolveAlertRoutingCreateSteps({
    channelConfigured: channelType.trim().length > 0,
    destinationConfigured: formValid,
    destinationSaved: args.list.items.length > 0,
  });
  const alertRoutingCreateEmphasizedStepId = resolveAlertRoutingCreateEmphasizedStepId({
    channelConfigured: channelType.trim().length > 0,
    destinationConfigured: formValid,
    destinationSaved: args.list.items.length > 0,
  });

  const thresholdPreview = useMemo(
    () => formatAlertRoutingThresholdPreview(minimumSeverity, routingCriteria.severities),
    [minimumSeverity, routingCriteria.severities],
  );

  const failure = args.list.listFailure ?? mutationFailure;

  const syncCreatePanelToUrl = useCallback(
    (showCreate: boolean) => {
      router.replace(compositeAlertRulesPanelsHrefFromSearch(searchParams.toString(), { showCreatePanel: showCreate }), {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  function scrollToForm() {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formSectionRef.current?.focus();
    syncCreatePanelToUrl(true);
  }

  useEffect(() => {
    if (!urlShowCreate || !args.list.scopedRunFilterActive) {
      return;
    }

    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formSectionRef.current?.focus();
  }, [args.list.scopedRunFilterActive, urlShowCreate]);

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
    if (!args.list.canEditRouting || creating) {
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
      await args.list.refreshRoutingTab();
    } catch (e) {
      setMutationFailure(toApiLoadFailure(e));
      setStatusMessage("Could not create the notification destination.");
    } finally {
      setCreating(false);
    }
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

  return {
    formSectionRef,
    creating,
    failure,
    statusMessage,
    fieldErrors,
    name,
    channelType,
    destination,
    minimumSeverity,
    routingCriteria,
    formValid,
    alertRoutingCreateSteps,
    alertRoutingCreateEmphasizedStepId,
    thresholdPreview,
    mutationDisabledReason,
    mutationDisabledHintId,
    setName,
    onChannelTypeChange,
    setDestination,
    setMinimumSeverity,
    setRoutingCriteria,
    scrollToForm,
    onCreate,
    resetCreateForm,
  };
}
