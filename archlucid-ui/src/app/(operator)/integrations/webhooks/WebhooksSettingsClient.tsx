"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { PageHeading } from "@/components/PageHeading";
import { WebhooksVsApiKeysReconciler } from "@/components/WebhooksVsApiKeysReconciler";
import { WebhooksVsDlqVocabularyRail } from "@/components/WebhooksVsDlqVocabularyRail";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createAlertRoutingSubscription,
  listAlertRoutingSubscriptions,
  testWebhookSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatWebhookDestinationLabel } from "@/lib/webhooks-destination-present";
import {
  formatWebhooksCustomerError,
  formatWebhooksSaveError,
} from "@/lib/webhooks-page-error-present";
import {
  WEBHOOKS_ACTIVE_HEADING,
  WEBHOOKS_DESTINATION_URL_HELPER,
  WEBHOOKS_DESTINATION_URL_LABEL,
  WEBHOOKS_EMPTY_BODY,
  WEBHOOKS_EMPTY_TITLE,
  WEBHOOKS_EVENTS_HELPER,
  WEBHOOKS_FORM_DESTINATION_HEADING,
  WEBHOOKS_FORM_EVENTS_HEADING,
  WEBHOOKS_NOT_CONFIGURED_NEXT_STEP,
  WEBHOOKS_PAGE_DESCRIPTION,
  WEBHOOKS_PAGE_TITLE,
  WEBHOOKS_SAVE_LABEL,
  WEBHOOKS_SAVE_THEN_TEST_HELPER,
  WEBHOOKS_SAVING_LABEL,
  WEBHOOKS_SEVERITY_HELPER,
  WEBHOOKS_SEVERITY_LABEL,
  WEBHOOKS_SIGNING_SECRET_HELPER,
  WEBHOOKS_SIGNING_SECRET_LABEL,
  WEBHOOKS_TEST_LABEL,
  WEBHOOKS_TESTING_LABEL,
  webhooksConfigurationStatusLabel,
  webhooksConfigurationStatusTagKind,
} from "@/lib/webhooks-page-copy";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import {
  labelForWebhookEventId,
  webhookOutboundEventCatalog,
  webhookSettingsDefaultValues,
  webhookSettingsFormSchema,
  type WebhookSettingsFormValues,
} from "@/lib/webhook-settings-form-schema";
import { summarizeMaskedWebhookSubscription, buildWebhookSubscriptionMetadata } from "@/lib/webhook-subscription-metadata";
import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";

import type { AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";

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

  async function onToggle(routingSubscriptionId: string) {
    if (!canMutate) {
      return;
    }

    setFailure(null);

    try {
      await toggleAlertRoutingSubscription(routingSubscriptionId);
      await load();
    } catch (error: unknown) {
      setFailure(toApiLoadFailure(error));
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
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" data-testid="webhooks-page">
      <PageHeading
        navHref={INTEGRATIONS_WEBHOOKS_PATH}
        title={WEBHOOKS_PAGE_TITLE}
        variant="integration"
        bordered
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 max-w-3xl leading-snug", OPERATOR_TYPOGRAPHY.body)}>{WEBHOOKS_PAGE_DESCRIPTION}</p>
            <div className="space-y-2" data-testid="webhooks-configuration-status">
              {loading ? (
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  Loading configuration status…
                </p>
              ) : (
                <StatusTag
                  kind={webhooksConfigurationStatusTagKind(activeSubscriptionCount)}
                  label={webhooksConfigurationStatusLabel(activeSubscriptionCount)}
                />
              )}
              {!loading && activeSubscriptionCount === 0 ? (
                <p
                  className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="webhooks-not-configured-next-step"
                >
                  {WEBHOOKS_NOT_CONFIGURED_NEXT_STEP}
                </p>
              ) : null}
            </div>
          </>
        }
      />
      <WebhooksVsApiKeysReconciler currentSurfaceId="webhooks" />
      <WebhooksVsDlqVocabularyRail currentSurfaceId="webhooks" />
      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={formatCustomerApiFailure(failure)}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <FormProvider {...form}>
          <form
            onSubmit={(event) => {
              if (isSavingRef.current) {
                event.preventDefault();

                return;
              }

              void submit(event);
            }}
            className={cn("space-y-8", !canMutate && "opacity-95")}
          >
            <section aria-labelledby="webhook-create-heading" className="space-y-6 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
              <div>
                <h2 id="webhook-create-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  New subscription
                </h2>
                <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {WEBHOOKS_SAVE_THEN_TEST_HELPER}
                </p>
              </div>

              <div className="space-y-5">
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{WEBHOOKS_FORM_DESTINATION_HEADING}</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="webhook-subscription-name">Subscription name</Label>
                    <Input
                      id="webhook-subscription-name"
                      className="mt-1"
                      disabled={!canMutate || isSaving}
                      title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                      {...register("name")}
                    />
                    {errors.name?.message !== undefined ? (
                      <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
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
                      title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                      {...register("webhookUrl")}
                    />
                    <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {WEBHOOKS_DESTINATION_URL_HELPER}
                    </p>
                    {errors.webhookUrl?.message !== undefined ? (
                      <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                        {errors.webhookUrl.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="webhook-secret">{WEBHOOKS_SIGNING_SECRET_LABEL}</Label>
                    <Input
                      id="webhook-secret"
                      type="password"
                      autoComplete="off"
                      className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
                      placeholder="Enter once — not shown after save"
                      disabled={!canMutate || isSaving}
                      title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                      {...register("secret")}
                    />
                    <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {WEBHOOKS_SIGNING_SECRET_HELPER}
                    </p>
                    {errors.secret?.message !== undefined ? (
                      <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                        {errors.secret.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
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
                      title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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
                                title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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

              <Button
                type="submit"
                disabled={!canMutate || loading || isSaving}
                title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                data-testid="webhook-save-button"
                aria-busy={isSaving}
              >
                {isSaving ? WEBHOOKS_SAVING_LABEL : WEBHOOKS_SAVE_LABEL}
              </Button>

              {saveSuccessMessage !== null ? (
                <OperatorSuccessCallout
                  message={saveSuccessMessage}
                  testId="webhook-save-success-callout"
                  onDismiss={() => setSaveSuccessMessage(null)}
                />
              ) : null}
            </section>

            <section aria-labelledby="webhook-existing-heading">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="webhook-existing-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {WEBHOOKS_ACTIVE_HEADING}
                  </h2>
                  <p className={cn("max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {webhookRows.length} subscription{webhookRows.length === 1 ? "" : "s"} in this workspace.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading} aria-busy={loading}>
                  {loading ? "Refreshing…" : "Refresh"}
                </Button>
              </div>

              {webhookRows.length === 0 ? (
                <div
                  className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700"
                  data-testid="webhooks-empty-state"
                >
                  <p className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{WEBHOOKS_EMPTY_TITLE}</p>
                  <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{WEBHOOKS_EMPTY_BODY}</p>
                </div>
              ) : (
                <ul className="grid gap-4">
                  {webhookRows.map((row) => {
                    const masked = summarizeMaskedWebhookSubscription(row.metadataJson);
                    const friendlyEventLabels = masked.eventTypes.map((eventId) => labelForWebhookEventId(eventId));
                    const destinationLabel = formatWebhookDestinationLabel(row.destination);

                    return (
                      <li
                        key={row.routingSubscriptionId}
                        className="overflow-hidden rounded-lg border border-neutral-200 bg-card p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
                        data-testid={`webhook-subscription-${row.routingSubscriptionId}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{row.name}</h3>
                            <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{destinationLabel}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <BooleanStatusChip
                              value={row.isEnabled === true}
                              trueLabel="Enabled"
                              falseLabel="Disabled"
                              data-testid={`webhook-enabled-${row.routingSubscriptionId}`}
                            />
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
                              title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                              onClick={() => void onToggle(row.routingSubscriptionId)}
                            >
                              {row.isEnabled === true ? "Disable" : "Enable"}
                            </Button>
                          </div>
                        </div>
                        <dl className={cn("mt-4 grid gap-2 text-al-text-primary sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
                          <div>
                            <dt className={OPERATOR_NAV_GROUP_LABEL}>Events</dt>
                            <dd>{friendlyEventLabels.length > 0 ? friendlyEventLabels.join(", ") : "—"}</dd>
                          </div>
                          <div>
                            <dt className={OPERATOR_NAV_GROUP_LABEL}>Minimum severity</dt>
                            <dd>{row.minimumSeverity}</dd>
                          </div>
                          <div>
                            <dt className={OPERATOR_NAV_GROUP_LABEL}>Signing secret</dt>
                            <dd className="text-al-text-secondary">{masked.secretStatus}</dd>
                          </div>
                          <div>
                            <dt className={OPERATOR_NAV_GROUP_LABEL}>Last successful delivery</dt>
                            <dd>{row.lastDeliveredUtc ?? "—"}</dd>
                          </div>
                        </dl>
                        {testResults[row.routingSubscriptionId] !== undefined ? (
                          <div
                            className={cn(
                              "mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60",
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
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </form>
        </FormProvider>
</div>
    </div>
  );
}
