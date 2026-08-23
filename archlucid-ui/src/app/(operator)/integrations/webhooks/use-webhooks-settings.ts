"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  type UseFormReturn,
} from "react-hook-form";

import type { AlertRoutingSubscriptionDisableTarget } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import {
  createAlertRoutingSubscription,
  listAlertRoutingSubscriptions,
  testWebhookSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { describeWebhooksSaveReadinessMessage } from "@/lib/webhooks-page-copy";
import {
  formatWebhooksCustomerError,
  formatWebhooksSaveError,
} from "@/lib/webhooks-page-error-present";
import {
  webhookSettingsDefaultValues,
  webhookSettingsFormSchema,
  type WebhookSettingsFormValues,
} from "@/lib/webhook-settings-form-schema";
import { buildWebhookSubscriptionMetadata } from "@/lib/webhook-subscription-metadata";
import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";
import type { AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";

type WebhookEnableTarget = {
  readonly routingSubscriptionId: string;
  readonly subscriptionName: string;
};

export type UseWebhooksSettingsResult = {
  readonly form: UseFormReturn<WebhookSettingsFormValues>;
  readonly register: UseFormRegister<WebhookSettingsFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<WebhookSettingsFormValues>;
  readonly control: Control<WebhookSettingsFormValues>;
  readonly errors: FieldErrors<WebhookSettingsFormValues>;
  readonly isSavingRef: RefObject<boolean>;
  readonly submit: ReturnType<UseFormHandleSubmit<WebhookSettingsFormValues>>;
  readonly canMutate: boolean;
  readonly items: AlertRoutingSubscription[];
  readonly loading: boolean;
  readonly isSaving: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly testingId: string | null;
  readonly testResults: Record<string, WebhookTestResponse>;
  readonly saveSuccessMessage: string | null;
  readonly pendingDisable: AlertRoutingSubscriptionDisableTarget | null;
  readonly disableBusy: boolean;
  readonly disableErrorMessage: string | null;
  readonly pendingEnable: WebhookEnableTarget | null;
  readonly enableBusy: boolean;
  readonly enableErrorMessage: string | null;
  readonly secretVisible: boolean;
  readonly formReadinessMessage: string | null;
  readonly canSubmitForm: boolean;
  readonly showAlertSeverityFilter: boolean;
  readonly webhookRows: AlertRoutingSubscription[];
  readonly activeSubscriptionCount: number;
  readonly load: () => Promise<void>;
  readonly onTestWebhook: (routingSubscriptionId: string) => Promise<void>;
  readonly onToggle: (routingSubscriptionId: string, subscriptionName: string, isEnabled: boolean) => Promise<void>;
  readonly confirmEnableSubscription: () => Promise<void>;
  readonly confirmDisableSubscription: () => Promise<void>;
  readonly setSecretVisible: Dispatch<SetStateAction<boolean>>;
  readonly setSaveSuccessMessage: Dispatch<SetStateAction<string | null>>;
  readonly setPendingDisable: Dispatch<SetStateAction<AlertRoutingSubscriptionDisableTarget | null>>;
  readonly setDisableErrorMessage: Dispatch<SetStateAction<string | null>>;
  readonly setPendingEnable: Dispatch<SetStateAction<WebhookEnableTarget | null>>;
  readonly setEnableErrorMessage: Dispatch<SetStateAction<string | null>>;
};

function isGenericOutboundWebhookChannel(channelType: string): boolean {
  return channelType === "OnCallWebhook";
}

export function formatCustomerApiFailure(failure: ApiLoadFailureState): string {
  return formatWebhooksCustomerError(
    "Something went wrong. Try again or contact your administrator.",
    failure.message,
  );
}

export function useWebhooksSettings(): UseWebhooksSettingsResult {
  const canMutate = useOperateCapability();
  const scope = useOperatorScopeQueryKey();
  const [items, setItems] = useState<AlertRoutingSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, WebhookTestResponse>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [pendingDisable, setPendingDisable] = useState<AlertRoutingSubscriptionDisableTarget | null>(null);
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableErrorMessage, setDisableErrorMessage] = useState<string | null>(null);
  const [pendingEnable, setPendingEnable] = useState<WebhookEnableTarget | null>(null);
  const [enableBusy, setEnableBusy] = useState(false);
  const [enableErrorMessage, setEnableErrorMessage] = useState<string | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);

  const form = useForm<WebhookSettingsFormValues>({
    resolver: zodResolver(webhookSettingsFormSchema),
    defaultValues: { ...webhookSettingsDefaultValues },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
  } = form;

  const watchedEventTypes = useWatch({ control, name: "eventTypes" });
  const watchedFormValues = useWatch({ control }) as WebhookSettingsFormValues;
  const formReadinessMessage = useMemo(
    () => describeWebhooksSaveReadinessMessage(watchedFormValues ?? webhookSettingsDefaultValues),
    [watchedFormValues],
  );
  const canSubmitForm = useMemo(
    () => webhookSettingsFormSchema.safeParse(watchedFormValues ?? webhookSettingsDefaultValues).success,
    [watchedFormValues],
  );
  const showAlertSeverityFilter =
    watchedEventTypes !== undefined &&
    watchedEventTypes.length > 0 &&
    watchedEventTypes.every((eventId) => eventId.startsWith("archlucid.alert."));

  const webhookRows = useMemo(
    () => items.filter((subscription) => isGenericOutboundWebhookChannel(subscription.channelType)),
    [items],
  );

  const activeSubscriptionCount = useMemo(
    () => webhookRows.filter((subscription) => subscription.isEnabled === true).length,
    [webhookRows],
  );

  const scopeKey = `${scope.tenantId}:${scope.workspaceId}:${scope.projectId}`;
  const previousScopeKeyRef = useRef(scopeKey);
  const scopeGenerationRef = useRef(0);

  const load = useCallback(async () => {
    const generation = scopeGenerationRef.current;
    setLoading(true);
    setFailure(null);

    try {
      const data = await listAlertRoutingSubscriptions();

      if (scopeGenerationRef.current !== generation) {
        return;
      }

      setItems(data);
    } catch (error: unknown) {
      if (scopeGenerationRef.current !== generation) {
        return;
      }

      setFailure(toApiLoadFailure(error));
    } finally {
      if (scopeGenerationRef.current === generation) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (previousScopeKeyRef.current === scopeKey) {
      return;
    }

    previousScopeKeyRef.current = scopeKey;
    scopeGenerationRef.current += 1;

    // Clear typed secrets and stale rows when the operator switches workspace/tenant/project.
    reset({ ...webhookSettingsDefaultValues });
    setSecretVisible(false);
    setSaveSuccessMessage(null);
    setItems([]);
    setTestResults({});
    setTestingId(null);
    setIsSaving(false);
    isSavingRef.current = false;
    setDisableBusy(false);
    setEnableBusy(false);
    setPendingDisable(null);
    setPendingEnable(null);
    setDisableErrorMessage(null);
    setEnableErrorMessage(null);
    setFailure(null);
    void load();
  }, [scopeKey, reset, load]);

  async function onTestWebhook(routingSubscriptionId: string) {
    if (testingId !== null) {
      return;
    }

    const generation = scopeGenerationRef.current;
    setTestingId(routingSubscriptionId);

    try {
      const result = await testWebhookSubscription(routingSubscriptionId);

      if (scopeGenerationRef.current !== generation) {
        return;
      }

      setTestResults((prev) => ({ ...prev, [routingSubscriptionId]: result }));
      presentWebhookConnectionTestToasts(result);
    } catch (error: unknown) {
      if (scopeGenerationRef.current !== generation) {
        return;
      }

      setTestResults((prev) => {
        const next = { ...prev };

        delete next[routingSubscriptionId];

        return next;
      });
      presentWebhookConnectionTestRequestFailure(error);
    } finally {
      if (scopeGenerationRef.current === generation) {
        setTestingId(null);
      }
    }
  }

  async function onToggle(routingSubscriptionId: string, subscriptionName: string, isEnabled: boolean) {
    if (!canMutate) {
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

    setEnableBusy(true);
    setEnableErrorMessage(null);

    try {
      await executeToggle(pendingEnable.routingSubscriptionId);
      setPendingEnable(null);
    } catch (error: unknown) {
      setEnableErrorMessage(formatCustomerApiFailure(toApiLoadFailure(error)));
    } finally {
      setEnableBusy(false);
    }
  }

  async function executeToggle(routingSubscriptionId: string): Promise<void> {
    setFailure(null);

    try {
      await toggleAlertRoutingSubscription(routingSubscriptionId);
      await load();
    } catch (error: unknown) {
      setFailure(toApiLoadFailure(error));
      throw error;
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
      setDisableErrorMessage(formatCustomerApiFailure(apiFailure));
    } finally {
      setDisableBusy(false);
    }
  }

  const submit = handleSubmit(async (values) => {
    if (!canMutate || isSavingRef.current) {
      return;
    }

    const normalizedName = values.name.trim();
    const duplicate = webhookRows.some(
      (row) => row.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicate) {
      setError("name", { type: "manual", message: "A subscription with this name already exists." });

      return;
    }

    setFailure(null);
    setSaveSuccessMessage(null);
    const generation = scopeGenerationRef.current;
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

      if (scopeGenerationRef.current !== generation) {
        return;
      }

      reset({ ...webhookSettingsDefaultValues });
      await load();
      setSaveSuccessMessage(WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE);
    } catch (error: unknown) {
      if (scopeGenerationRef.current !== generation) {
        return;
      }

      const apiFailure = toApiLoadFailure(error);
      setFailure({
        ...apiFailure,
        message: formatWebhooksSaveError(apiFailure.message),
      });
    } finally {
      if (scopeGenerationRef.current === generation) {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }
  });

  return {
    form,
    register,
    handleSubmit,
    control,
    errors,
    isSavingRef,
    submit,
    canMutate,
    items,
    loading,
    isSaving,
    failure,
    testingId,
    testResults,
    saveSuccessMessage,
    pendingDisable,
    disableBusy,
    disableErrorMessage,
    pendingEnable,
    enableBusy,
    enableErrorMessage,
    secretVisible,
    formReadinessMessage,
    canSubmitForm,
    showAlertSeverityFilter,
    webhookRows,
    activeSubscriptionCount,
    load,
    onTestWebhook,
    onToggle,
    confirmEnableSubscription,
    confirmDisableSubscription,
    setSecretVisible,
    setSaveSuccessMessage,
    setPendingDisable,
    setDisableErrorMessage,
    setPendingEnable,
    setEnableErrorMessage,
  };
}
