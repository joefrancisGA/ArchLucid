"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Webhook } from "lucide-react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  labelForWebhookEventId,
  WEBHOOK_CHANNEL_TYPE_LABELS,
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
import { showSuccess } from "@/lib/toast";

import type { AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";

function isGenericOutboundWebhookChannel(channelType: string): boolean {
  return channelType === "OnCallWebhook";
}

/** Integration hub for outbound HTTP webhook subscriptions (URLs + signed metadata + simulated delivery test). */
export function WebhooksSettingsClient() {
  const canMutate = useOperateCapability();
  const [items, setItems] = useState<AlertRoutingSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  /** ID of subscription currently undergoing `POST .../webhooks/subscriptions/{id}/test`; null when idle. */
  const [testingId, setTestingId] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<Record<string, WebhookTestResponse>>({});

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
  } = form;

  const watchedEventTypes = useWatch({ control, name: "eventTypes" });
  const showAlertSeverityFilter =
    watchedEventTypes === undefined ||
    watchedEventTypes.length === 0 ||
    watchedEventTypes.every((eventId) => eventId.startsWith("archlucid.alert."));

  const webhookRows = useMemo(
    () => items.filter((s) => isGenericOutboundWebhookChannel(s.channelType)),
    [items],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await listAlertRoutingSubscriptions();

      setItems(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onTestWebhook(routingSubscriptionId: string) {
    if (testingId !== null)
      return;

    setTestingId(routingSubscriptionId);

    try {
      const result = await testWebhookSubscription(routingSubscriptionId);

      setTestResults((prev) => ({ ...prev, [routingSubscriptionId]: result }));

      presentWebhookConnectionTestToasts(result);
    } catch (e) {
      setTestResults((prev) => {
        const next = { ...prev };

        delete next[routingSubscriptionId];

        return next;
      });
      presentWebhookConnectionTestRequestFailure(e);
    } finally {
      setTestingId(null);
    }
  }

  async function onToggle(routingSubscriptionId: string) {
    if (!canMutate)
      return;

    setFailure(null);

    try {
      await toggleAlertRoutingSubscription(routingSubscriptionId);
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  const submit = handleSubmit(async (values) => {
    if (!canMutate)
      return;

    setFailure(null);

    try {
      await createAlertRoutingSubscription({
        name: values.name.trim(),
        channelType: values.channelType,
        destination: values.webhookUrl.trim(),
        minimumSeverity: values.minimumSeverity,
        isEnabled: true,
        metadataJson: buildWebhookSubscriptionMetadata(values.secret, values.eventTypes),
      });
      reset({ ...webhookSettingsDefaultValues });
      await load();
      showSuccess("Webhook subscription saved.");
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  });

  return (
    <div className="w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <LayerHeader pageKey="webhooks" density="compact" collapsibleGuidance="About outbound webhooks" />

      <header className="flex flex-wrap items-start gap-3 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-900">
          <Webhook className="h-6 w-6 text-neutral-700 dark:text-neutral-200" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Webhooks</h1>
          <p className={cn("leading-snug text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Send ArchLucid events to custom HTTPS endpoints. Secrets are stored with the subscription but are never
            shown again in this UI.
          </p>
          <p className={cn("leading-snug text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            For product-specific notification setup, use{" "}
            <Link className={OPERATOR_LINK.inline} href="/integrations/teams">
              Microsoft Teams
            </Link>{" "}
            or{" "}
            <Link className={OPERATOR_LINK.inline} href="/integrations/slack">
              Slack
            </Link>
            .
          </p>
          <p className={cn("leading-snug text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Use generic webhooks for custom HTTP endpoints. Provider templates format payloads for common receivers.
          </p>
        </div>
      </header>

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <FormProvider {...form}>
        <form onSubmit={(e) => void submit(e)} className={cn("space-y-8", !canMutate && "opacity-95")}>
          <section aria-labelledby="webhook-create-heading" className="space-y-5">
            <div>
              <h2 id="webhook-create-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                New webhook subscription
              </h2>
              <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                After saving, use <strong className="font-medium">Test Connection</strong> to send a synthetic ping through
                ArchLucid.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="webhook-subscription-name">Subscription name</Label>
                <Input
                  id="webhook-subscription-name"
                  className="mt-1"
                  disabled={!canMutate}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  {...register("name")}
                />
                {errors.name?.message !== undefined ? (
                  <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="webhook-provider-type">Provider template</Label>
                <select
                  id="webhook-provider-type"
                  className={cn(
                    "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:border-neutral-700 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  disabled={!canMutate}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  {...register("channelType")}
                >
                  <option value="OnCallWebhook">{WEBHOOK_CHANNEL_TYPE_LABELS.OnCallWebhook}</option>
                </select>
                {errors.channelType?.message !== undefined ? (
                  <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                    {errors.channelType.message}
                  </p>
                ) : null}
              </div>

              {showAlertSeverityFilter ? (
                <div>
                  <Label htmlFor="webhook-minimum-severity">Minimum alert severity</Label>
                  <select
                    id="webhook-minimum-severity"
                    className={cn(
                    "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:border-neutral-700 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                    disabled={!canMutate}
                    title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                    {...register("minimumSeverity")}
                  >
                    <option value="Info">Info</option>
                    <option value="Warning">Warning</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Applies when delivering alert events only.
                  </p>
                  {errors.minimumSeverity?.message !== undefined ? (
                    <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                      {errors.minimumSeverity.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="sm:col-span-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
                  placeholder="https://example.com/path"
                  disabled={!canMutate}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  {...register("webhookUrl")}
                />
                <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Must be an HTTPS endpoint reachable from ArchLucid.
                </p>
                {errors.webhookUrl?.message !== undefined ? (
                  <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                    {errors.webhookUrl.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="webhook-secret">Shared secret</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  autoComplete="off"
                  className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
                  placeholder="Paste once — it will not be shown after save"
                  disabled={!canMutate}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  {...register("secret")}
                />
                <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Minimum 16 characters. The secret is stored securely and will not be shown again after saving.
                </p>
                {errors.secret?.message !== undefined ? (
                  <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                    {errors.secret.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <fieldset>
                  <legend className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Event types</legend>
                  <p className={cn("mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Select which events ArchLucid should deliver through this webhook.
                  </p>
                  <Controller
                    name="eventTypes"
                    control={control}
                    render={({ field }) => (
                      <div className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
                        {webhookOutboundEventCatalog.map((opt) => {
                          const checked = field.value.includes(opt.id);

                          return (
                            <label key={opt.id} className={cn("flex cursor-pointer items-start gap-2 leading-snug", OPERATOR_TYPOGRAPHY.body)}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canMutate}
                                title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                                onChange={() => {
                                  const next = checked ? field.value.filter((v) => v !== opt.id) : [...field.value, opt.id];

                                  field.onChange(next);
                                }}
                                className="mt-[3px] h-4 w-4"
                              />
                              <span className="min-w-0 space-y-0.5">
                                <span className="font-medium text-al-text-primary">{opt.label}</span>
                                <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                                  {opt.description}
                                </span>
                                <details className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                                  <summary className={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                                    Technical event name
                                  </summary>
                                  <span className={cn("mt-1 block font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.badge)}>
                                    {opt.id}
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
            </div>

            <Button
              type="submit"
              disabled={!canMutate || loading}
              title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
              data-testid="webhook-save-button"
            >
              Save webhook subscription
            </Button>
          </section>

          <section aria-labelledby="webhook-existing-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="webhook-existing-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  Active webhook subscriptions
                </h2>
                <p className={cn("max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Outbound HTTP integrations in this workspace ({webhookRows.length}).
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>

            {webhookRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
                <p className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>No webhook subscriptions yet</p>
                <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  Create a subscription to send ArchLucid events to an external HTTPS endpoint.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4">
                {webhookRows.map((row) => {
                  const masked = summarizeMaskedWebhookSubscription(row.metadataJson);
                  const channelLabel =
                    WEBHOOK_CHANNEL_TYPE_LABELS[row.channelType as WebhookSettingsFormValues["channelType"]] ??
                    row.channelType;
                  const friendlyEventLabels = masked.eventTypes.map((eventId) => labelForWebhookEventId(eventId));

                  return (
                    <li
                      key={row.routingSubscriptionId}
                      className="overflow-hidden rounded-lg border border-neutral-200 bg-card p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{row.name}</h3>
                          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{channelLabel}</p>
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
                            title="Deliver a simulated ping payload to verify connectivity."
                            onClick={() => void onTestWebhook(row.routingSubscriptionId)}
                            data-testid={`webhook-test-${row.routingSubscriptionId}`}
                          >
                            {testingId === row.routingSubscriptionId ? "Testing…" : "Test Connection"}
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
                      <dl className={cn("mt-4 grid gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        <div>
                          <dt className={OPERATOR_NAV_GROUP_LABEL}>Destination URL</dt>
                          <dd className={cn("break-all font-mono", OPERATOR_TYPOGRAPHY.body)}>{row.destination}</dd>
                        </div>
                        <div>
                          <dt className={OPERATOR_NAV_GROUP_LABEL}>Shared secret</dt>
                          <dd className={cn("font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{masked.secretStatus}</dd>
                        </div>
                        <div>
                          <dt className={OPERATOR_NAV_GROUP_LABEL}>Event types</dt>
                          <dd className={OPERATOR_TYPOGRAPHY.body}>
                            {friendlyEventLabels.length > 0 ? friendlyEventLabels.join(", ") : "(none persisted)"}
                          </dd>
                        </div>
                      </dl>
                      <details
                        className={cn(
                          "mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50",
                          OPERATOR_TYPOGRAPHY.helper,
                        )}
                      >
                        <summary className={cn("cursor-pointer select-none text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                          Advanced details
                        </summary>
                        <dl className={cn("mt-3 grid gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          <div>
                            <dt className={OPERATOR_NAV_GROUP_LABEL}>Channel type</dt>
                            <dd className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{row.channelType}</dd>
                          </div>
                          <div>
                            <dt className={OPERATOR_NAV_GROUP_LABEL}>Technical event names</dt>
                            <dd className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                              {masked.eventTypes.length > 0 ? masked.eventTypes.join(", ") : "(none persisted)"}
                            </dd>
                          </div>
                          <div>
                            <dt className={OPERATOR_NAV_GROUP_LABEL}>Metadata</dt>
                            <dd>
                              <pre
                                className={cn(
                                  "max-h-48 overflow-auto rounded bg-neutral-100 p-2 text-al-text-primary dark:bg-neutral-950 dark:text-neutral-200",
                                  OPERATOR_TYPOGRAPHY.micro,
                                )}
                              >
                                {masked.displayMetadataJson}
                              </pre>
                            </dd>
                          </div>
                        </dl>
                      </details>
                      {testResults[row.routingSubscriptionId] !== undefined ? (
                        <div
                          className={cn(
                            "mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                          data-testid={`webhook-test-result-${row.routingSubscriptionId}`}
                        >
                          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Last test response</p>
                          {testResults[row.routingSubscriptionId]!.transportSucceeded ? (
                            <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                              HTTP <span className="font-mono">{testResults[row.routingSubscriptionId]!.statusCode}</span>
                              {testResults[row.routingSubscriptionId]!.reasonPhrase !== null &&
                              testResults[row.routingSubscriptionId]!.reasonPhrase !== undefined &&
                              testResults[row.routingSubscriptionId]!.reasonPhrase!.length > 0 ? (
                                <span> {testResults[row.routingSubscriptionId]!.reasonPhrase}</span>
                              ) : null}
                            </p>
                          ) : (
                            <p className={cn("m-0 mt-1 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
                              Transport failed: {testResults[row.routingSubscriptionId]!.error ?? "Unknown error"}
                            </p>
                          )}
                          {testResults[row.routingSubscriptionId]!.responseBodyPreview !== null &&
                          testResults[row.routingSubscriptionId]!.responseBodyPreview !== undefined &&
                          testResults[row.routingSubscriptionId]!.responseBodyPreview!.length > 0 ? (
                            <>
                              <p className={cn("m-0 mt-2 uppercase text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Response body</p>
                              <pre
                                className={cn(
                                  "mt-1 max-h-48 overflow-auto rounded bg-neutral-100 p-2 text-al-text-primary dark:bg-neutral-950 dark:text-neutral-200",
                                  OPERATOR_TYPOGRAPHY.micro,
                                )}
                              >
                                {testResults[row.routingSubscriptionId]!.responseBodyPreview}
                              </pre>
                              {testResults[row.routingSubscriptionId]!.responseBodyTruncated ? (
                                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                                  Response body truncated for display.
                                </p>
                              ) : null}
                            </>
                          ) : testResults[row.routingSubscriptionId]!.transportSucceeded ? (
                            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                              No response body returned.
                            </p>
                          ) : null}
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
  );
}
