"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormHandleSubmit, UseFormReturn } from "react-hook-form";

import type { AlertRoutingSubscriptionDisableTarget } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";
import { WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import {
  createAlertRoutingSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  formatWebhooksCustomerError,
  formatWebhooksSaveError,
} from "@/lib/webhooks-page-error-present";
import type { WebhookSettingsFormValues } from "@/lib/webhook-settings-form-schema";
import { webhookSettingsDefaultValues } from "@/lib/webhook-settings-form-schema";
import { buildWebhookSubscriptionMetadata } from "@/lib/webhook-subscription-metadata";
import { writeWebhookSubscriptionLastViewedId } from "@/lib/resolve-continue-last-webhook-subscription";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import {
  parseWebhookDisableIdFromSearch,
  parseWebhookEnableIdFromSearch,
  webhooksToggleConfirmHrefFromSearch,
} from "@/lib/integrations/webhooks-toggle-confirm-url";

export type WebhookEnableTarget = {
  readonly routingSubscriptionId: string;
  readonly subscriptionName: string;
};

export function formatCustomerApiFailure(failure: ApiLoadFailureState): string {
  return formatWebhooksCustomerError(
    "Something went wrong. Try again or contact your administrator.",
    failure.message,
  );
}

export type UseWebhooksSettingsMutationsOptions = {
  readonly canMutate: boolean;
  readonly reset: UseFormReturn<WebhookSettingsFormValues>["reset"];
  readonly setError: UseFormReturn<WebhookSettingsFormValues>["setError"];
  readonly handleSubmit: UseFormHandleSubmit<WebhookSettingsFormValues>;
  readonly webhookRows: AlertRoutingSubscription[];
  readonly scopeGenerationRef: React.RefObject<number>;
  readonly load: () => Promise<void>;
  readonly setFailure: React.Dispatch<React.SetStateAction<ApiLoadFailureState | null>>;
};

export type UseWebhooksSettingsMutationsResult = {
  readonly isSavingRef: React.RefObject<boolean>;
  readonly submit: ReturnType<UseFormHandleSubmit<WebhookSettingsFormValues>>;
  readonly isSaving: boolean;
  readonly saveSuccessMessage: string | null;
  readonly pendingDisable: AlertRoutingSubscriptionDisableTarget | null;
  readonly disableBusy: boolean;
  readonly disableErrorMessage: string | null;
  readonly pendingEnable: WebhookEnableTarget | null;
  readonly enableBusy: boolean;
  readonly enableErrorMessage: string | null;
  readonly onToggle: (routingSubscriptionId: string, subscriptionName: string, isEnabled: boolean) => Promise<void>;
  readonly confirmEnableSubscription: () => Promise<void>;
  readonly confirmDisableSubscription: () => Promise<void>;
  readonly setSaveSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setPendingDisable: React.Dispatch<React.SetStateAction<AlertRoutingSubscriptionDisableTarget | null>>;
  readonly setDisableErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setPendingEnable: React.Dispatch<React.SetStateAction<WebhookEnableTarget | null>>;
  readonly setEnableErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  readonly resetMutationState: () => void;
};

export function useWebhooksSettingsMutations(
  options: UseWebhooksSettingsMutationsOptions,
): UseWebhooksSettingsMutationsResult {
  const router = useRouter();
  const pathname = usePathname() ?? INTEGRATIONS_WEBHOOKS_PATH;
  const searchParams = useSearchParams();
  const urlDisableId = parseWebhookDisableIdFromSearch(searchParams.get("webhookDisableId"));
  const urlEnableId = parseWebhookEnableIdFromSearch(searchParams.get("webhookEnableId"));
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [pendingDisable, setPendingDisableState] = useState<AlertRoutingSubscriptionDisableTarget | null>(null);
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableErrorMessage, setDisableErrorMessage] = useState<string | null>(null);
  const [pendingEnable, setPendingEnableState] = useState<WebhookEnableTarget | null>(null);
  const [enableBusy, setEnableBusy] = useState(false);
  const [enableErrorMessage, setEnableErrorMessage] = useState<string | null>(null);

  const syncToggleConfirmToUrl = useCallback(
    (state: { disableId: string | null; enableId: string | null }) => {
      router.replace(
        webhooksToggleConfirmHrefFromSearch(
          searchParams.toString(),
          {
            disableRoutingSubscriptionId: state.disableId,
            enableRoutingSubscriptionId: state.enableId,
          },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingDisable = useCallback(
    (value: AlertRoutingSubscriptionDisableTarget | null) => {
      setPendingDisableState(value);
      syncToggleConfirmToUrl({
        disableId: value?.routingSubscriptionId ?? null,
        enableId: null,
      });
    },
    [syncToggleConfirmToUrl],
  );

  const setPendingEnable = useCallback(
    (value: WebhookEnableTarget | null) => {
      setPendingEnableState(value);
      syncToggleConfirmToUrl({
        disableId: null,
        enableId: value?.routingSubscriptionId ?? null,
      });
    },
    [syncToggleConfirmToUrl],
  );

  useEffect(() => {
    if (urlDisableId.length === 0 && urlEnableId.length === 0) {
      if (pendingDisable !== null) {
        setPendingDisableState(null);
      }

      if (pendingEnable !== null) {
        setPendingEnableState(null);
      }

      return;
    }

    if (options.webhookRows.length === 0) {
      return;
    }

    if (urlDisableId.length > 0) {
      const subscription = options.webhookRows.find((row) => row.routingSubscriptionId === urlDisableId);

      if (subscription === undefined) {
        return;
      }

      if (pendingDisable?.routingSubscriptionId === urlDisableId) {
        return;
      }

      setPendingDisableState({
        routingSubscriptionId: subscription.routingSubscriptionId,
        subscriptionName: subscription.name,
        channel: "webhook",
      });

      return;
    }

    const subscription = options.webhookRows.find((row) => row.routingSubscriptionId === urlEnableId);

    if (subscription === undefined) {
      return;
    }

    if (pendingEnable?.routingSubscriptionId === urlEnableId) {
      return;
    }

    setPendingEnableState({
      routingSubscriptionId: subscription.routingSubscriptionId,
      subscriptionName: subscription.name,
    });
  }, [
    options.webhookRows,
    pendingDisable?.routingSubscriptionId,
    pendingEnable?.routingSubscriptionId,
    urlDisableId,
    urlEnableId,
  ]);

  const resetMutationState = useCallback(() => {
    setSaveSuccessMessage(null);
    setIsSaving(false);
    isSavingRef.current = false;
    setDisableBusy(false);
    setEnableBusy(false);
    setPendingDisable(null);
    setPendingEnable(null);
    setDisableErrorMessage(null);
    setEnableErrorMessage(null);
  }, [setPendingDisable, setPendingEnable]);

  async function executeToggle(routingSubscriptionId: string, generation: number): Promise<void> {
    if (options.scopeGenerationRef.current !== generation) {
      return;
    }

    options.setFailure(null);

    try {
      await toggleAlertRoutingSubscription(routingSubscriptionId);

      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      await options.load();
    } catch (error: unknown) {
      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      options.setFailure(toApiLoadFailure(error));
      throw error;
    }
  }

  async function onToggle(routingSubscriptionId: string, subscriptionName: string, isEnabled: boolean) {
    if (!options.canMutate) {
      return;
    }

    if (isEnabled) {
      setDisableErrorMessage(null);
      setPendingDisable({
        routingSubscriptionId,
        subscriptionName,
        channel: "webhook",
      });

      return;
    }

    setEnableErrorMessage(null);
    setPendingEnable({ routingSubscriptionId, subscriptionName });
  }

  async function confirmEnableSubscription(): Promise<void> {
    if (pendingEnable === null || enableBusy) {
      return;
    }

    const generation = options.scopeGenerationRef.current;
    setEnableBusy(true);
    setEnableErrorMessage(null);
    writeWebhookSubscriptionLastViewedId(pendingEnable.routingSubscriptionId);

    try {
      await executeToggle(pendingEnable.routingSubscriptionId, generation);

      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      setPendingEnable(null);
    } catch (error: unknown) {
      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      setEnableErrorMessage(formatCustomerApiFailure(toApiLoadFailure(error)));
    } finally {
      if (options.scopeGenerationRef.current === generation) {
        setEnableBusy(false);
      }
    }
  }

  async function confirmDisableSubscription(): Promise<void> {
    if (pendingDisable === null || disableBusy) {
      return;
    }

    const generation = options.scopeGenerationRef.current;
    setDisableBusy(true);
    setDisableErrorMessage(null);

    try {
      await executeToggle(pendingDisable.routingSubscriptionId, generation);

      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      setPendingDisable(null);
    } catch (error: unknown) {
      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      const apiFailure = toApiLoadFailure(error);
      setDisableErrorMessage(formatCustomerApiFailure(apiFailure));
    } finally {
      if (options.scopeGenerationRef.current === generation) {
        setDisableBusy(false);
      }
    }
  }

  const submit = options.handleSubmit(async (values) => {
    if (!options.canMutate || isSavingRef.current) {
      return;
    }

    const normalizedName = values.name.trim();
    const duplicate = options.webhookRows.some(
      (row) => row.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicate) {
      options.setError("name", { type: "manual", message: "A subscription with this name already exists." });

      return;
    }

    options.setFailure(null);
    setSaveSuccessMessage(null);
    const generation = options.scopeGenerationRef.current;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      await createAlertRoutingSubscription({
        name: normalizedName,
        channelType: values.channelType,
        destination: values.webhookUrl.trim(),
        minimumSeverity: values.minimumSeverity,
        isEnabled: true,
        metadataJson: buildWebhookSubscriptionMetadata(values.secret, values.eventTypes),
      });

      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      options.reset({ ...webhookSettingsDefaultValues });
      await options.load();
      setSaveSuccessMessage(WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE);
    } catch (error: unknown) {
      if (options.scopeGenerationRef.current !== generation) {
        return;
      }

      const apiFailure = toApiLoadFailure(error);
      options.setFailure({
        ...apiFailure,
        message: formatWebhooksSaveError(apiFailure.message),
      });
    } finally {
      if (options.scopeGenerationRef.current === generation) {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }
  });

  return {
    isSavingRef,
    submit,
    isSaving,
    saveSuccessMessage,
    pendingDisable,
    disableBusy,
    disableErrorMessage,
    pendingEnable,
    enableBusy,
    enableErrorMessage,
    onToggle,
    confirmEnableSubscription,
    confirmDisableSubscription,
    setSaveSuccessMessage,
    setPendingDisable,
    setDisableErrorMessage,
    setPendingEnable,
    setEnableErrorMessage,
    resetMutationState,
  };
}
