"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { AlertRoutingCriteriaFields } from "@/components/alerts/AlertRoutingCriteriaFields";
import { AlertRoutingDestinationList } from "@/components/alerts/AlertRoutingDestinationList";
import { Button } from "@/components/ui/button";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertRoutingCreateSubscriptionButtonLabelReaderRank,
  alertRoutingPageLeadOperator,
  alertRoutingPageLeadOperatorEmpty,
  alertRoutingPageLeadReader,
  alertRoutingPageLeadReaderEmpty,
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
  formatAlertRoutingThresholdPreview,
  isAlertRoutingDestinationFormValid,
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

const DEFAULT_DESTINATION_NAME = "Primary notification destination";

export function AlertRoutingContent() {
  const canMutateRouting = useOperateCapability();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  // Keep reportTabLoaded off the load() dependency list — stamping freshness recreates
  // the context value and would otherwise retrigger the mount load in a loop.
  const reportTabLoadedRef = useRef(refreshContext?.reportTabLoaded);
  reportTabLoadedRef.current = refreshContext?.reportTabLoaded;
  const registerTabLoader = refreshContext?.registerTabLoader;
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

  const [name, setName] = useState(DEFAULT_DESTINATION_NAME);
  const [channelType, setChannelType] = useState("Email");
  const [destination, setDestination] = useState("");
  const [minimumSeverity, setMinimumSeverity] = useState("High");
  const [routingCriteria, setRoutingCriteria] = useState<AlertRoutingCriteria>(EMPTY_ALERT_ROUTING_CRITERIA);

  const formValid = useMemo(
    () => isAlertRoutingDestinationFormValid(channelType, name, destination),
    [channelType, destination, name],
  );

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

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const data = await listAlertRoutingSubscriptions();
      setItems(data);
      reportTabLoadedRef.current?.("notifications");
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (registerTabLoader === undefined) {
      return;
    }

    return registerTabLoader("notifications", load);
  }, [load, registerTabLoader]);

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
        name: name.trim() || DEFAULT_DESTINATION_NAME,
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
      setName(DEFAULT_DESTINATION_NAME);
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
          {pageLead}
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
        <h3 id="alert-routing-form-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {items.length === 0 ? "Destination details" : "Set up alert delivery"}
        </h3>

        <fieldset className="space-y-4 border-0 p-0" disabled={!canMutateRouting}>
          <legend className={cn("mb-2 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Destination
          </legend>
          <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Destination name
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
            {thresholdPreview.preview}
          </p>
          {thresholdPreview.criticalExcludedWarning !== null ? (
            <p
              className={cn("rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="alert-routing-threshold-critical-warning"
              role="status"
            >
              {thresholdPreview.criticalExcludedWarning}
            </p>
          ) : null}
        </fieldset>

        <AlertRoutingCriteriaFields
          criteria={routingCriteria}
          onChange={setRoutingCriteria}
          disabled={!canMutateRouting || creating}
          disabledTitle={enterpriseMutationControlDisabledTitle}
        />

        <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <Button
            type="button"
            variant="primary"
            onClick={() => void onCreate(false)}
            disabled={!canMutateRouting || creating || !formValid}
            title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
            data-testid="alert-routing-create-destination"
          >
            {creating ? "Creating destination…" : canMutateRouting ? "Create notification destination" : alertRoutingCreateSubscriptionButtonLabelReaderRank}
          </Button>
          {isWebhookChannelType(channelType) ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void onCreate(true)}
              disabled={!canMutateRouting || creating || !formValid}
              title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
            >
              {creating ? "Working…" : "Send test notification"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setName(DEFAULT_DESTINATION_NAME);
              setChannelType("Email");
              setDestination("");
              setMinimumSeverity("High");
              setRoutingCriteria({ ...EMPTY_ALERT_ROUTING_CRITERIA });
              setFieldErrors({});
              setStatusMessage("Form reset.");
            }}
            disabled={creating}
          >
            Reset form
          </Button>
        </div>
      </section>
    </div>
  );
}
