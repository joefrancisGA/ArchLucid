"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { AlertRoutingCriteriaFields } from "@/components/alerts/AlertRoutingCriteriaFields";
import { AlertRoutingDestinationList } from "@/components/alerts/AlertRoutingDestinationList";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertRoutingCreateSubscriptionButtonLabelReaderRank,
  alertRoutingPageLeadOperator,
  alertRoutingPageLeadReader,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import {
  alertRoutingEmptyGettingStartedOperator,
  alertRoutingEmptyGettingStartedReader,
} from "@/lib/alerts-hub-empty-guidance";
import {
  EMPTY_ALERT_ROUTING_CRITERIA,
  type AlertRoutingCriteria,
} from "@/lib/alert-routing-criteria";
import {
  destinationFieldHelper,
  destinationFieldLabel,
  destinationFieldPlaceholder,
  formatMinimumSeverityPreview,
  isWebhookChannelType,
  type AlertRoutingFieldErrors,
  validateAlertRoutingDestination,
  validateAlertRoutingName,
} from "@/lib/alert-routing-form";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  createAlertRoutingSubscription,
  listAlertRoutingDeliveryAttempts,
  listAlertRoutingSubscriptions,
  testWebhookSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription } from "@/types/alert-routing";

const DEFAULT_SUBSCRIPTION_NAME = "Primary notification destination";

export function AlertRoutingContent() {
  const canMutateRouting = useOperateCapability();
  const formSectionRef = useRef<HTMLElement | null>(null);
  const statusRegionId = useId();
  const [items, setItems] = useState<AlertRoutingSubscription[]>([]);
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, AlertRoutingDeliveryAttempt[]>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AlertRoutingFieldErrors>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const [name, setName] = useState(DEFAULT_SUBSCRIPTION_NAME);
  const [channelType, setChannelType] = useState("Email");
  const [destination, setDestination] = useState("");
  const [minimumSeverity, setMinimumSeverity] = useState("High");
  const [routingCriteria, setRoutingCriteria] = useState<AlertRoutingCriteria>(EMPTY_ALERT_ROUTING_CRITERIA);

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
    if (!canMutateRouting || creating) {
      return;
    }

    if (!validateForm()) {
      setStatusMessage("Fix the highlighted fields before saving.");

      return;
    }

    setCreating(true);
    setFailure(null);
    setStatusMessage(sendTestAfterSave ? "Creating destination and sending test notification…" : "Creating destination…");

    try {
      const created = await createAlertRoutingSubscription({
        name: name.trim() || DEFAULT_SUBSCRIPTION_NAME,
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
      setName(DEFAULT_SUBSCRIPTION_NAME);
      setMinimumSeverity("High");
      setFieldErrors({});
      setStatusMessage("Notification destination created.");
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setStatusMessage("Could not create the notification destination.");
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(id: string) {
    if (!canMutateRouting) {
      return;
    }

    setFailure(null);
    try {
      await toggleAlertRoutingSubscription(id);
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  async function loadAttempts(routingSubscriptionId: string) {
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <h2 className={cn("mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Notification delivery</h2>
        <p className={cn("mb-2 max-w-prose leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Choose where qualifying alerts are sent and verify that delivery is working.
        </p>
        <p className={cn("max-w-prose text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {canMutateRouting ? alertRoutingPageLeadOperator : alertRoutingPageLeadReader}
        </p>
        <AlertOperatorToolingRankCue />
      </header>

      <div id={statusRegionId} role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <section aria-labelledby="alert-routing-destinations-heading" className="space-y-4">
        <h3 id="alert-routing-destinations-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Notification destinations
        </h3>
        <AlertRoutingDestinationList
          items={items}
          attemptsBySub={attemptsBySub}
          canMutateRouting={canMutateRouting}
          testingId={testingId}
          loading={loading}
          onRefresh={() => void load()}
          onAddDestination={scrollToForm}
          onToggle={(id) => void onToggle(id)}
          onLoadAttempts={(id) => void loadAttempts(id)}
          onTest={(id) => void onTest(id)}
        />
        {items.length === 0 ? (
          <GettingStartedSteps
            {...(canMutateRouting ? alertRoutingEmptyGettingStartedOperator : alertRoutingEmptyGettingStartedReader)}
          />
        ) : null}
      </section>

      <section
        ref={formSectionRef}
        tabIndex={-1}
        aria-labelledby="alert-routing-form-heading"
        className={cn("space-y-6 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950", !canMutateRouting && "opacity-90")}
      >
        <div>
          <h3 id="alert-routing-form-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Set up alert delivery
          </h3>
          <ol className={cn("mt-3 list-decimal space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            <li>Choose a notification channel and destination.</li>
            <li>Select the minimum severity that should trigger a notification.</li>
            <li>Optionally limit notifications by finding category or review label.</li>
            <li>Save the destination and send a test notification.</li>
          </ol>
        </div>

        <fieldset className="space-y-4 border-0 p-0" disabled={!canMutateRouting}>
          <legend className={cn("mb-2 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Destination
          </legend>
          <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Subscription name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canMutateRouting || creating}
              title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
              aria-invalid={fieldErrors.name !== undefined}
              aria-describedby={fieldErrors.name ? "alert-routing-name-error" : undefined}
              className="mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600"
            />
            {fieldErrors.name ? (
              <span id="alert-routing-name-error" className={cn("mt-1 block text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}>
                {fieldErrors.name}
              </span>
            ) : null}
          </label>
          <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Notification channel
            <select
              value={channelType}
              onChange={(e) => {
                setChannelType(e.target.value);
                setDestination("");
                setFieldErrors((prev) => ({ ...prev, destination: undefined }));
              }}
              disabled={!canMutateRouting || creating}
              title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
              className="mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600"
            >
              <option value="Email">Email</option>
              <option value="TeamsWebhook">Microsoft Teams</option>
              <option value="SlackWebhook">Slack</option>
              <option value="OnCallWebhook">On-call webhook</option>
            </select>
          </label>
          <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            {destinationFieldLabel(channelType)}
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={destinationFieldPlaceholder(channelType)}
              disabled={!canMutateRouting || creating}
              title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
              aria-invalid={fieldErrors.destination !== undefined}
              aria-describedby={fieldErrors.destination ? "alert-routing-destination-error" : "alert-routing-destination-help"}
              className={cn(
                "mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600",
                channelType === "Email" ? "" : "font-mono",
              )}
              data-testid="alert-routing-destination-input"
            />
            <span id="alert-routing-destination-help" className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {destinationFieldHelper(channelType)}
            </span>
            {fieldErrors.destination ? (
              <span id="alert-routing-destination-error" className={cn("mt-1 block text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}>
                {fieldErrors.destination}
              </span>
            ) : null}
          </label>
        </fieldset>

        <fieldset className="space-y-3 border-0 p-0" disabled={!canMutateRouting}>
          <legend className={cn("mb-2 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Alert threshold
          </legend>
          <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Minimum severity
            <select
              value={minimumSeverity}
              onChange={(e) => setMinimumSeverity(e.target.value)}
              disabled={!canMutateRouting || creating}
              title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
              className="mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600"
              data-testid="alert-routing-minimum-severity"
            >
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
          <p
            className={cn("rounded-md bg-neutral-50 px-3 py-2 text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
            data-testid="alert-routing-threshold-preview"
          >
            {formatMinimumSeverityPreview(minimumSeverity)}
          </p>
        </fieldset>

        <AlertRoutingCriteriaFields
          criteria={routingCriteria}
          onChange={setRoutingCriteria}
          disabled={!canMutateRouting || creating}
          disabledTitle={enterpriseMutationControlDisabledTitle}
        />

        <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => void onCreate(false)}
            disabled={!canMutateRouting || creating}
            title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
            className="rounded-md bg-[var(--al-primary)] px-4 py-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-focus-ring)] disabled:opacity-60"
            data-testid="alert-routing-create-destination"
          >
            {creating ? "Creating destination…" : canMutateRouting ? "Create notification destination" : alertRoutingCreateSubscriptionButtonLabelReaderRank}
          </button>
          {isWebhookChannelType(channelType) ? (
            <button
              type="button"
              onClick={() => void onCreate(true)}
              disabled={!canMutateRouting || creating}
              title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
              className="rounded-md border border-neutral-300 px-4 py-2 font-medium text-neutral-800 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-focus-ring)] disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900"
            >
              {creating ? "Working…" : "Send test notification"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setName(DEFAULT_SUBSCRIPTION_NAME);
              setChannelType("Email");
              setDestination("");
              setMinimumSeverity("High");
              setRoutingCriteria({ ...EMPTY_ALERT_ROUTING_CRITERIA });
              setFieldErrors({});
              setStatusMessage("Form reset.");
            }}
            disabled={creating}
            className="rounded-md px-3 py-2 text-neutral-600 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-focus-ring)] dark:text-neutral-300"
          >
            Reset form
          </button>
        </div>
      </section>
    </div>
  );
}
