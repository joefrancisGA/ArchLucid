"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { WEBHOOKS_SUBSCRIPTIONS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { PageHeading } from "@/components/PageHeading";
import { WebhooksApiKeysVocabularyRail } from "@/components/WebhooksApiKeysVocabularyRail";
import { WebhooksVsDlqVocabularyRail } from "@/components/WebhooksVsDlqVocabularyRail";
import { ConnectionStatusWebhooksVocabularyRail } from "@/components/ConnectionStatusWebhooksVocabularyRail";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WebhooksIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createAlertRoutingSubscription,
  listAlertRoutingSubscriptions,
  testWebhookSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { formatWebhookDestinationLabel } from "@/lib/webhooks-destination-present";
import {
  formatWebhooksCustomerError,
  formatWebhooksSaveError,
} from "@/lib/webhooks-page-error-present";
import {
  WEBHOOKS_ABOUT_DEVELOPERS,
  WEBHOOKS_ABOUT_SECURITY,
  WEBHOOKS_ABOUT_WHAT_WE_SEND,
  WEBHOOKS_ABOUT_WHEN_TO_USE,
  WEBHOOKS_ALERT_PAYLOAD_SAMPLE_JSON,
  WEBHOOKS_CLOUD_EVENTS_ENVELOPE_NOTE,
  WEBHOOKS_DELIVERY_CONTRACT_HEADING,
  WEBHOOKS_DESTINATION_URL_HELPER,
  WEBHOOKS_DESTINATION_URL_LABEL,
  WEBHOOKS_ENABLE_CONFIRM_LABEL,
  WEBHOOKS_ENABLE_CONFIRM_TITLE,
  WEBHOOKS_EVENTS_HELPER,
  WEBHOOKS_FORM_DESTINATION_HEADING,
  WEBHOOKS_FORM_EVENTS_HEADING,
  WEBHOOKS_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_NOT_CONFIGURED_NEXT_STEP,
  WEBHOOKS_PAGE_DESCRIPTION,
  WEBHOOKS_PAGE_TITLE,
  WEBHOOKS_SAVE_LABEL,
  WEBHOOKS_SAVE_THEN_TEST_HELPER,
  WEBHOOKS_SAVING_LABEL,
  WEBHOOKS_SEVERITY_HELPER,
  WEBHOOKS_SEVERITY_LABEL,
  WEBHOOKS_SIGNATURE_ALGORITHM,
  WEBHOOKS_SIGNATURE_HEADER_NAME,
  WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE,
  WEBHOOKS_SIGNATURE_VALUE_PREFIX,
  WEBHOOKS_SIGNATURE_VERIFICATION,
  WEBHOOKS_SIGNING_SECRET_HELPER,
  WEBHOOKS_SIGNING_SECRET_LABEL,
  WEBHOOKS_SUBSCRIPTIONS_HEADING,
  WEBHOOKS_TEST_LABEL,
  WEBHOOKS_TESTING_LABEL,
  describeWebhooksSaveReadinessMessage,
  webhooksEnableConfirmDescription,
  webhooksConfigurationStatusLabel,
  webhooksConfigurationStatusTagKind,
} from "@/lib/webhooks-page-copy";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import {
  labelForWebhookEventId,
  webhookOutboundEventCatalog,
  webhookSettingsDefaultValues,
  webhookSettingsFormSchema,
  type WebhookSettingsFormValues,
} from "@/lib/webhook-settings-form-schema";
import { summarizeMaskedWebhookSubscription, buildWebhookSubscriptionMetadata, formatWebhookSubscriptionLastDeliveryLabel } from "@/lib/webhook-subscription-metadata";
import { presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";

import {
  AlertRoutingSubscriptionDisableDialog,
  type AlertRoutingSubscriptionDisableTarget,
} from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";

import type { AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";

type WebhookEnableTarget = {
  readonly routingSubscriptionId: string;
  readonly subscriptionName: string;
};

function isGenericOutboundWebhookChannel(channelType: string): boolean {
  return channelType === "OnCallWebhook";
}

function formatCustomerApiFailure(failure: ApiLoadFailureState): string {
  return formatWebhooksCustomerError(
    "Something went wrong. Try again or contact your administrator.",
    failure.message,
  );
}

/** Integration hub for outbound HTTPS webhook subscriptions. */
export function WebhooksSettingsClient() {
  const canMutate = useOperateCapability();
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

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await listAlertRoutingSubscriptions();

      setItems(data);
    } catch (error: unknown) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onTestWebhook(routingSubscriptionId: string) {
    if (testingId !== null) {
      return;
    }

    setTestingId(routingSubscriptionId);

    try {
      const result = await testWebhookSubscription(routingSubscriptionId);

      setTestResults((prev) => ({ ...prev, [routingSubscriptionId]: result }));
      presentWebhookConnectionTestToasts(result);
    } catch (error: unknown) {
      setTestResults((prev) => {
        const next = { ...prev };

        delete next[routingSubscriptionId];

        return next;
      });
      presentWebhookConnectionTestRequestFailure(error);
    } finally {
      setTestingId(null);
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
      reset({ ...webhookSettingsDefaultValues });
      await load();
      setSaveSuccessMessage(WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE);
    } catch (error: unknown) {
      const apiFailure = toApiLoadFailure(error);
      setFailure({
        ...apiFailure,
        message: formatWebhooksSaveError(apiFailure.message),
      });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  });

  return (
    <div
      className={cn("w-full max-w-[68rem] px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="webhooks-page"
    >
      <PageHeading
        navHref={INTEGRATIONS_WEBHOOKS_PATH}
        title={WEBHOOKS_PAGE_TITLE}
        variant="integration"
        bordered
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 leading-snug", OPERATOR_TYPOGRAPHY.body)}>{WEBHOOKS_PAGE_DESCRIPTION}</p>
            <div className="space-y-2" data-testid="webhooks-configuration-status">
              {loading ? (
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  Loading configuration status…
                </p>
              ) : (
                <StatusTag
                  kind={webhooksConfigurationStatusTagKind(webhookRows.length, activeSubscriptionCount)}
                  label={webhooksConfigurationStatusLabel(webhookRows.length, activeSubscriptionCount)}
                />
              )}
              {!loading && webhookRows.length === 0 ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="webhooks-not-configured-next-step"
                >
                  {WEBHOOKS_NOT_CONFIGURED_NEXT_STEP}
                </p>
              ) : null}
            </div>
          </>
        }
      />
      <WebhooksApiKeysVocabularyRail currentSurfaceId="webhooks" />
      <WebhooksVsDlqVocabularyRail currentSurfaceId="webhooks" />
      <ConnectionStatusWebhooksVocabularyRail currentSurfaceId="webhooks" />
      <WebhooksIntegrationEvidenceOrientationStrip />
      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={formatCustomerApiFailure(failure)}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <FormProvider {...form}>
        <form
          onSubmit={(event) => {
            if (isSavingRef.current) {
              event.preventDefault();

              return;
            }

            void submit(event);
          }}
          className={cn(OPERATOR_LAYOUT.sectionStack, !canMutate && "opacity-95")}
        >
          <section aria-labelledby="webhook-existing-heading" data-testid="webhooks-subscriptions-section">
            <div className={cn("mb-3 flex flex-wrap items-end justify-between", OPERATOR_LAYOUT.controlClusterGap)}>
              <div>
                <h2 id="webhook-existing-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {WEBHOOKS_SUBSCRIPTIONS_HEADING}
                </h2>
                {webhookRows.length > 0 ? (
                  <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {webhookRows.length} subscription{webhookRows.length === 1 ? "" : "s"} in this workspace.
                  </p>
                ) : null}
              </div>
              {webhookRows.length > 0 ? (
                <RefreshButton busy={loading} onClick={() => void load()} />
              ) : null}
            </div>

            {loading && webhookRows.length === 0 ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="webhooks-subscriptions-loading"
              >
                Loading subscriptions…
              </p>
            ) : webhookRows.length === 0 ? (
              <EnterpriseCompactEmptyState {...WEBHOOKS_SUBSCRIPTIONS_EMPTY_COMPACT} />
            ) : (
              <EnterpriseTable ariaLabel="Webhook subscriptions" data-testid="webhooks-subscriptions-table">
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow>
                    <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Destination</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Events</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Minimum severity</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Signing secret</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Last delivery</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {webhookRows.map((row) => {
                    const masked = summarizeMaskedWebhookSubscription(row.metadataJson);
                    const friendlyEventLabels = masked.eventTypes.map((eventId) => labelForWebhookEventId(eventId));
                    const destinationLabel = formatWebhookDestinationLabel(row.destination);

                    return (
                      <EnterpriseTableRow
                        key={row.routingSubscriptionId}
                        data-testid={`webhook-subscription-${row.routingSubscriptionId}`}
                      >
                        <EnterpriseTableCell>
                          <span className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.name}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{destinationLabel}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={OPERATOR_TYPOGRAPHY.helper}>
                            {friendlyEventLabels.length > 0 ? friendlyEventLabels.join(", ") : "—"}
                          </span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={OPERATOR_TYPOGRAPHY.helper}>{row.minimumSeverity}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{masked.secretStatus}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <BooleanStatusChip
                            value={row.isEnabled === true}
                            trueLabel="Enabled"
                            falseLabel="Disabled"
                            data-testid={`webhook-enabled-${row.routingSubscriptionId}`}
                          />
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                            {formatWebhookSubscriptionLastDeliveryLabel(row.lastDeliveredUtc)}
                          </span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={testingId !== null}
                              onClick={() => void onTestWebhook(row.routingSubscriptionId)}
                              data-testid={`webhook-test-${row.routingSubscriptionId}`}
                              aria-busy={testingId === row.routingSubscriptionId}
                            >
                              {testingId === row.routingSubscriptionId ? WEBHOOKS_TESTING_LABEL : WEBHOOKS_TEST_LABEL}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!canMutate || loading}
                              onClick={() => void onToggle(row.routingSubscriptionId, row.name, row.isEnabled === true)}
                              data-testid={`webhook-toggle-${row.routingSubscriptionId}`}
                            >
                              {row.isEnabled === true ? "Disable" : "Enable"}
                            </Button>
                          </div>
                          {testResults[row.routingSubscriptionId] !== undefined ? (
                            <div
                              className={cn(
                                "mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60",
                                OPERATOR_TYPOGRAPHY.body,
                              )}
                              data-testid={`webhook-test-result-${row.routingSubscriptionId}`}
                              role="status"
                            >
                              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                                Latest test result
                              </p>
                              {testResults[row.routingSubscriptionId]!.transportSucceeded ? (
                                <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                                  HTTP <span className="font-mono">{testResults[row.routingSubscriptionId]!.statusCode}</span>
                                </p>
                              ) : (
                                <p className={cn("m-0 mt-1 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
                                  {formatWebhooksCustomerError(
                                    "We could not reach the destination.",
                                    testResults[row.routingSubscriptionId]!.error,
                                  )}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </EnterpriseTableCell>
                      </EnterpriseTableRow>
                    );
                  })}
                </EnterpriseTableBody>
              </EnterpriseTable>
            )}
          </section>

          <section
            aria-labelledby="webhook-create-heading"
            className={cn(
              "rounded-lg border border-neutral-200 dark:border-neutral-800",
              OPERATOR_LAYOUT.cardPadding,
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <div>
              <h2 id="webhook-create-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                New subscription
              </h2>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {WEBHOOKS_SAVE_THEN_TEST_HELPER}
              </p>
            </div>

            {!canMutate ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="webhooks-mutation-prerequisite-notice"
                role="status"
              >
                {WEBHOOKS_MUTATION_PREREQUISITE_NOTICE}
              </p>
            ) : null}

            <div className={OPERATOR_LAYOUT.sectionStack}>
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{WEBHOOKS_FORM_DESTINATION_HEADING}</h3>
              <div className={cn("grid sm:grid-cols-2", OPERATOR_LAYOUT.unrelatedClusterGap)}>
                <div className="sm:col-span-2">
                  <Label htmlFor="webhook-subscription-name">Subscription name</Label>
                  <Input
                    id="webhook-subscription-name"
                    className="mt-1"
                    disabled={!canMutate || isSaving}
                    aria-invalid={errors.name?.message !== undefined ? true : undefined}
                    aria-describedby={
                      errors.name?.message !== undefined ? "webhook-subscription-name-error" : undefined
                    }
                    {...register("name")}
                  />
                  {errors.name?.message !== undefined ? (
                    <p
                      id="webhook-subscription-name-error"
                      role="alert"
                      className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
                    >
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="webhook-url">{WEBHOOKS_DESTINATION_URL_LABEL}</Label>
                  <Input
                    id="webhook-url"
                    className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
                    placeholder="https://example.com/webhooks/archlucid"
                    disabled={!canMutate || isSaving}
                    aria-invalid={errors.webhookUrl?.message !== undefined ? true : undefined}
                    aria-describedby="webhook-url-helper webhook-url-error"
                    {...register("webhookUrl")}
                  />
                  <p id="webhook-url-helper" className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {WEBHOOKS_DESTINATION_URL_HELPER}
                  </p>
                  {errors.webhookUrl?.message !== undefined ? (
                    <p
                      id="webhook-url-error"
                      role="alert"
                      className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
                    >
                      {errors.webhookUrl.message}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="webhook-secret">{WEBHOOKS_SIGNING_SECRET_LABEL}</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="webhook-secret"
                      type={secretVisible ? "text" : "password"}
                      autoComplete="new-password"
                      className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}
                      placeholder="Enter once — not shown after save"
                      disabled={!canMutate || isSaving}
                      aria-invalid={errors.secret?.message !== undefined ? true : undefined}
                      aria-describedby="webhook-secret-helper webhook-secret-error"
                      {...register("secret")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={!canMutate || isSaving}
                      aria-label={secretVisible ? "Hide signing secret" : "Show signing secret"}
                      onClick={() => setSecretVisible((current) => !current)}
                    >
                      {secretVisible ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <p id="webhook-secret-helper" className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {WEBHOOKS_SIGNING_SECRET_HELPER}
                  </p>
                  {errors.secret?.message !== undefined ? (
                    <p
                      id="webhook-secret-error"
                      role="alert"
                      className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
                    >
                      {errors.secret.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <details
                className={cn(
                  "rounded-md border border-neutral-200 p-4 dark:border-neutral-800",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                data-testid="webhooks-delivery-contract-disclosure"
              >
                <summary
                  className={cn(
                    "cursor-pointer select-none font-medium text-al-text-primary outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {WEBHOOKS_DELIVERY_CONTRACT_HEADING}
                </summary>
                <div className={cn("mt-3 space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  <p className="m-0">{WEBHOOKS_ABOUT_WHEN_TO_USE}</p>
                  <p className="m-0">{WEBHOOKS_ABOUT_WHAT_WE_SEND}</p>
                  <p className="m-0">{WEBHOOKS_ABOUT_SECURITY}</p>
                  <p className="m-0">{WEBHOOKS_ABOUT_DEVELOPERS}</p>
                  <p className="m-0">{WEBHOOKS_CLOUD_EVENTS_ENVELOPE_NOTE}</p>
                  <div>
                    <p className="m-0 font-medium text-al-text-primary">Sample alert payload</p>
                    <pre
                      className={cn(
                        "mt-2 overflow-x-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/60",
                        OPERATOR_TYPOGRAPHY.badge,
                      )}
                    >
                      {WEBHOOKS_ALERT_PAYLOAD_SAMPLE_JSON}
                    </pre>
                  </div>
                  <div>
                    <p className="m-0 font-medium text-al-text-primary">Signature header</p>
                    <p className="m-0 mt-1">
                      <span className="font-mono">{WEBHOOKS_SIGNATURE_HEADER_NAME}</span>:{" "}
                      <span className="font-mono">
                        {WEBHOOKS_SIGNATURE_VALUE_PREFIX}
                        {"{lowercase-hex-digest}"}
                      </span>
                    </p>
                    <p className="m-0 mt-2">{WEBHOOKS_SIGNATURE_ALGORITHM}</p>
                    <p className="m-0 mt-2">{WEBHOOKS_SIGNATURE_VERIFICATION}</p>
                    <p className="m-0 mt-2 text-al-text-primary">{WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE}</p>
                  </div>
                </div>
              </details>
            </div>

            <div className={OPERATOR_LAYOUT.sectionStack}>
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{WEBHOOKS_FORM_EVENTS_HEADING}</h3>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{WEBHOOKS_EVENTS_HELPER}</p>

              {showAlertSeverityFilter ? (
                <div>
                  <Label htmlFor="webhook-minimum-severity">{WEBHOOKS_SEVERITY_LABEL}</Label>
                  <select
                    id="webhook-minimum-severity"
                    className={cn(
                      "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:border-neutral-700 dark:bg-neutral-950",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    disabled={!canMutate || isSaving}
                    {...register("minimumSeverity")}
                  >
                    <option value="Info">Info</option>
                    <option value="Warning">Warning</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {WEBHOOKS_SEVERITY_HELPER}
                  </p>
                  {errors.minimumSeverity?.message !== undefined ? (
                    <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                      {errors.minimumSeverity.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <fieldset>
                <legend className="sr-only">Webhook events</legend>
                <Controller
                  name="eventTypes"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
                      {webhookOutboundEventCatalog.map((option) => {
                        const checked = field.value.includes(option.id);

                        return (
                          <label
                            key={option.id}
                            className={cn("flex cursor-pointer items-start gap-2 leading-snug", OPERATOR_TYPOGRAPHY.body)}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canMutate || isSaving}
                              onChange={() => {
                                const next = checked
                                  ? field.value.filter((value) => value !== option.id)
                                  : [...field.value, option.id];

                                field.onChange(next);
                              }}
                              className="mt-[3px] h-4 w-4"
                            />
                            <span className="min-w-0 space-y-0.5">
                              <span className="font-medium text-al-text-primary">{option.label}</span>
                              <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                                {option.description}
                              </span>
                              <details className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                                <summary
                                  className={cn(
                                    "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                                  )}
                                >
                                  Technical event name
                                </summary>
                                <span className={cn("mt-1 block font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.badge)}>
                                  {option.id}
                                </span>
                              </details>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </fieldset>
              {errors.eventTypes?.message !== undefined ? (
                <p role="alert" className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                  {errors.eventTypes.message}
                </p>
              ) : null}
            </div>

            <div
              className={cn(
                "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end",
                OPERATOR_LAYOUT.controlClusterGap,
              )}
            >
              <WhyDisabledCtaHint
                id="webhook-save-readiness"
                testId="webhook-save-readiness"
                className="sm:mr-auto sm:text-left"
                reason={
                  canMutate && !canSubmitForm && !isSaving && !loading && formReadinessMessage !== null
                    ? whyDisabledIncompleteInput(formReadinessMessage)
                    : null
                }
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!canMutate || loading || isSaving || !canSubmitForm}
                data-testid="webhook-save-button"
                aria-busy={isSaving}
                aria-describedby={
                  canMutate && !canSubmitForm && !isSaving && !loading && formReadinessMessage !== null
                    ? "webhook-save-readiness"
                    : undefined
                }
              >
                {isSaving ? WEBHOOKS_SAVING_LABEL : WEBHOOKS_SAVE_LABEL}
              </Button>
            </div>

            {saveSuccessMessage !== null ? (
              <OperatorSuccessCallout
                message={saveSuccessMessage}
                testId="webhook-save-success-callout"
                onDismiss={() => setSaveSuccessMessage(null)}
              />
            ) : null}
          </section>
        </form>
      </FormProvider>

      <AlertRoutingSubscriptionDisableDialog
        target={pendingDisable}
        busy={disableBusy}
        errorMessage={disableErrorMessage}
        onCancel={() => {
          if (!disableBusy) {
            setPendingDisable(null);
            setDisableErrorMessage(null);
          }
        }}
        onConfirm={() => {
          void confirmDisableSubscription();
        }}
      />

      <ConfirmationDialog
        open={pendingEnable !== null}
        onOpenChange={(open) => {
          if (!open && !enableBusy) {
            setPendingEnable(null);
            setEnableErrorMessage(null);
          }
        }}
        title={WEBHOOKS_ENABLE_CONFIRM_TITLE}
        description={webhooksEnableConfirmDescription(pendingEnable?.subscriptionName ?? "")}
        confirmLabel={WEBHOOKS_ENABLE_CONFIRM_LABEL}
        variant="default"
        busy={enableBusy}
        onConfirm={() => {
          void confirmEnableSubscription();
        }}
        extraContent={
          enableErrorMessage !== null ? (
            <p
              className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
              role="alert"
              data-testid="webhook-subscription-enable-error"
            >
              {enableErrorMessage}
            </p>
          ) : null
        }
      />
    </div>
  );
}
