"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
import { showSuccess } from "@/lib/toast";

import type { AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";

const SLACK_CHANNEL_TYPE: WebhookSettingsFormValues["channelType"] = "SlackWebhook";

/** Slack alert routing — Slack incoming webhook URLs for architecture alerts in this workspace scope. */
export function SlackIntegrationPageClient(): React.ReactElement {
  const canMutate = useOperateCapability();
  const [items, setItems] = useState<AlertRoutingSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, WebhookTestResponse>>({});

  const form = useForm<WebhookSettingsFormValues>({
    resolver: zodResolver(webhookSettingsFormSchema),
    defaultValues: { ...webhookSettingsDefaultValues, channelType: SLACK_CHANNEL_TYPE },
    mode: "onBlur",
  });

  const { register, handleSubmit, control, formState: { errors }, reset } = form;
  const watchedEventTypes = useWatch({ control, name: "eventTypes" });
  const showAlertSeverityFilter =
    watchedEventTypes === undefined ||
    watchedEventTypes.length === 0 ||
    watchedEventTypes.every((eventId) => eventId.startsWith("archlucid.alert."));

  const slackRows = useMemo(
    () => items.filter((row) => row.channelType === SLACK_CHANNEL_TYPE),
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
    if (testingId !== null) {
      return;
    }

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
    if (!canMutate) {
      return;
    }

    setFailure(null);

    try {
      await toggleAlertRoutingSubscription(routingSubscriptionId);
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  const submit = handleSubmit(async (values) => {
    if (!canMutate) {
      return;
    }

    setFailure(null);

    try {
      await createAlertRoutingSubscription({
        name: values.name.trim(),
        channelType: SLACK_CHANNEL_TYPE,
        destination: values.webhookUrl.trim(),
        minimumSeverity: values.minimumSeverity,
        isEnabled: true,
        metadataJson: buildWebhookSubscriptionMetadata(values.secret, values.eventTypes),
      });
      reset({ ...webhookSettingsDefaultValues, channelType: SLACK_CHANNEL_TYPE });
      await load();
      showSuccess("Slack route saved.");
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  });

  return (
    <div className="w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" data-testid="integrations-slack-page">
      <LayerHeader pageKey="slack-notifications" density="compact" collapsibleGuidance="About Slack notifications" />

      <header className="space-y-2 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Slack</h1>
        <p className={cn("leading-snug text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Route architecture alerts to Slack channels using incoming webhook URLs. Secrets are stored with the
          subscription and are not shown again after save.
        </p>
        <p className={cn("leading-snug text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          See{" "}
          <Link className={OPERATOR_LINK.inline} href={INTEGRATIONS_READINESS_PATH}>
            Integration readiness
          </Link>{" "}
          for cross-integration status. For Microsoft Teams, use{" "}
          <Link className={OPERATOR_LINK.inline} href="/integrations/teams">
            Microsoft Teams
          </Link>
          .
        </p>
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
          <section aria-labelledby="slack-create-heading" className="space-y-5">
            <div>
              <h2 id="slack-create-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                New Slack route
              </h2>
              <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Paste a Slack incoming webhook URL for the channel that should receive alerts.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="slack-route-name">Route name</Label>
                <Input
                  id="slack-route-name"
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

              {showAlertSeverityFilter ? (
                <div className="sm:col-span-2">
                  <Label htmlFor="slack-minimum-severity">Minimum alert severity</Label>
                  <select
                    id="slack-minimum-severity"
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
                </div>
              ) : null}

              <div className="sm:col-span-2">
                <Label htmlFor="slack-webhook-url">Slack webhook URL</Label>
                <Input
                  id="slack-webhook-url"
                  className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
                  placeholder="https://hooks.slack.com/services/..."
                  disabled={!canMutate}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  {...register("webhookUrl")}
                />
                {errors.webhookUrl?.message !== undefined ? (
                  <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                    {errors.webhookUrl.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="slack-secret">Signing secret</Label>
                <Input
                  id="slack-secret"
                  type="password"
                  autoComplete="off"
                  className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
                  placeholder="Paste once — it will not be shown after save"
                  disabled={!canMutate}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  {...register("secret")}
                />
                {errors.secret?.message !== undefined ? (
                  <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                    {errors.secret.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <fieldset>
                  <legend className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Event types</legend>
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
                                onChange={() => {
                                  const next = checked ? field.value.filter((v) => v !== opt.id) : [...field.value, opt.id];
                                  field.onChange(next);
                                }}
                                className="mt-[3px] h-4 w-4"
                              />
                              <span className="font-medium text-al-text-primary">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                </fieldset>
              </div>
            </div>

            <Button type="submit" disabled={!canMutate || loading} data-testid="slack-save-button">
              Save Slack route
            </Button>
          </section>

          <section aria-labelledby="slack-existing-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="slack-existing-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  Active Slack routes
                </h2>
                <p className={cn("max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Enabled Slack webhook routes in this workspace ({slackRows.length}).
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>

            {slackRows.length === 0 ? (
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No Slack routes configured yet.</p>
            ) : (
              <ul className="grid gap-4">
                {slackRows.map((row) => {
                  const masked = summarizeMaskedWebhookSubscription(row.metadataJson);
                  const friendlyEventLabels = masked.eventTypes.map((eventId) => labelForWebhookEventId(eventId));

                  return (
                    <li
                      key={row.routingSubscriptionId}
                      className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{row.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <BooleanStatusChip value={row.isEnabled === true} trueLabel="Enabled" falseLabel="Disabled" />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={testingId !== null}
                            onClick={() => void onTestWebhook(row.routingSubscriptionId)}
                          >
                            {testingId === row.routingSubscriptionId ? "Testing…" : "Test connection"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!canMutate || loading}
                            onClick={() => void onToggle(row.routingSubscriptionId)}
                          >
                            {row.isEnabled === true ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                      <dl className={cn("mt-4 grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
                        <div>
                          <dt className={OPERATOR_NAV_GROUP_LABEL}>Webhook URL</dt>
                          <dd className={cn("break-all font-mono", OPERATOR_TYPOGRAPHY.body)}>{row.destination}</dd>
                        </div>
                        <div>
                          <dt className={OPERATOR_NAV_GROUP_LABEL}>Event types</dt>
                          <dd>{friendlyEventLabels.length > 0 ? friendlyEventLabels.join(", ") : "(none)"}</dd>
                        </div>
                      </dl>
                      {testResults[row.routingSubscriptionId] !== undefined ? (
                        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          Last test:{" "}
                          {testResults[row.routingSubscriptionId]!.transportSucceeded ? "delivered" : "failed"}
                        </p>
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
