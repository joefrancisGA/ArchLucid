"use client";

import { useCallback, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormReturn,
} from "react-hook-form";

import type { AlertRoutingSubscriptionDisableTarget } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { describeWebhooksSaveReadinessMessage } from "@/lib/webhooks-page-copy";
import {
  webhookSettingsDefaultValues,
  webhookSettingsFormSchema,
  type WebhookSettingsFormValues,
} from "@/lib/webhook-settings-form-schema";
import type { AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";

import {
  formatCustomerApiFailure,
  useWebhooksSettingsMutations,
} from "./use-webhooks-settings-mutations";
import { useWebhooksSettingsConnectionTest } from "./use-webhooks-settings-connection-test";
import { useWebhooksSettingsLoad } from "./use-webhooks-settings-load";

export { formatCustomerApiFailure };

export type UseWebhooksSettingsResult = {
  readonly form: UseFormReturn<WebhookSettingsFormValues>;
  readonly register: UseFormReturn<WebhookSettingsFormValues>["register"];
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
  readonly pendingEnable: { readonly routingSubscriptionId: string; readonly subscriptionName: string } | null;
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
  readonly setPendingEnable: Dispatch<
    SetStateAction<{ readonly routingSubscriptionId: string; readonly subscriptionName: string } | null>
  >;
  readonly setEnableErrorMessage: Dispatch<SetStateAction<string | null>>;
};

export function useWebhooksSettings(): UseWebhooksSettingsResult {
  const canMutate = useOperateCapability();
  const [secretVisible, setSecretVisible] = useState(false);
  const mutationResetRef = useRef<() => void>(() => {});
  const connectionTestResetRef = useRef<() => void>(() => {});

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

  const handleScopeChange = useCallback(() => {
    reset({ ...webhookSettingsDefaultValues });
    setSecretVisible(false);
    mutationResetRef.current();
    connectionTestResetRef.current();
  }, [reset]);

  const loadState = useWebhooksSettingsLoad({ onScopeChange: handleScopeChange });

  const connectionTest = useWebhooksSettingsConnectionTest({
    scopeGenerationRef: loadState.scopeGenerationRef,
  });
  connectionTestResetRef.current = connectionTest.resetConnectionTestState;

  const mutations = useWebhooksSettingsMutations({
    canMutate,
    reset,
    setError,
    handleSubmit,
    webhookRows: loadState.webhookRows,
    scopeGenerationRef: loadState.scopeGenerationRef,
    load: loadState.load,
    setFailure: loadState.setFailure,
  });
  mutationResetRef.current = mutations.resetMutationState;

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

  return {
    form,
    register,
    handleSubmit,
    control,
    errors,
    isSavingRef: mutations.isSavingRef,
    submit: mutations.submit,
    canMutate,
    items: loadState.items,
    loading: loadState.loading,
    isSaving: mutations.isSaving,
    failure: loadState.failure,
    testingId: connectionTest.testingId,
    testResults: connectionTest.testResults,
    saveSuccessMessage: mutations.saveSuccessMessage,
    pendingDisable: mutations.pendingDisable,
    disableBusy: mutations.disableBusy,
    disableErrorMessage: mutations.disableErrorMessage,
    pendingEnable: mutations.pendingEnable,
    enableBusy: mutations.enableBusy,
    enableErrorMessage: mutations.enableErrorMessage,
    secretVisible,
    formReadinessMessage,
    canSubmitForm,
    showAlertSeverityFilter,
    webhookRows: loadState.webhookRows,
    activeSubscriptionCount: loadState.activeSubscriptionCount,
    load: loadState.load,
    onTestWebhook: connectionTest.onTestWebhook,
    onToggle: mutations.onToggle,
    confirmEnableSubscription: mutations.confirmEnableSubscription,
    confirmDisableSubscription: mutations.confirmDisableSubscription,
    setSecretVisible,
    setSaveSuccessMessage: mutations.setSaveSuccessMessage,
    setPendingDisable: mutations.setPendingDisable,
    setDisableErrorMessage: mutations.setDisableErrorMessage,
    setPendingEnable: mutations.setPendingEnable,
    setEnableErrorMessage: mutations.setEnableErrorMessage,
  };
}
