"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperateExecutePageHint } from "@/components/OperateCapabilityHints";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { AlertRoutingCriteriaFields } from "@/components/alerts/AlertRoutingCriteriaFields";
import { AlertRoutingDestinationList } from "@/components/alerts/AlertRoutingDestinationList";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  AlertRoutingSubscriptionDisableDialog,
  type AlertRoutingSubscriptionDisableTarget,
} from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useAlertRoutingSubscriptionsQuery } from "@/components/alerts/use-alert-rules-hub-queries";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertRoutingCreateSubscriptionButtonLabelReaderRank,
  alertRoutingPageLeadOperator,
  alertRoutingPageLeadOperatorEmpty,
  alertRoutingPageLeadReader,
  alertRoutingPageLeadReaderEmpty,
} from "@/lib/enterprise-controls-context-copy";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
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
import {
  ALERT_ROUTING_DESTINATION_NAME_PLACEHOLDER,
  formatAlertRoutingConfigProvenanceLine,
  summarizeAlertRoutingDeliveryHealth,
} from "@/lib/alert-routing-presentation";
import { latestAlertRoutingConfigChange } from "@/lib/alert-routing-config-change";
import {
  ALERT_RULES_SAMPLE_MODE_BANNER,
  ALERT_RULES_SAMPLE_MODE_CTA_HREF,
  ALERT_RULES_SAMPLE_MODE_CTA_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_AUDIT_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import {
  createAlertRoutingSubscription,
  listAlertRoutingDeliveryAttempts,
  testWebhookSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "@/lib/webhook-subscription-connection-test";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription } from "@/types/alert-routing";

export function AlertRoutingContent() {
  const canMutateRouting = useOperateCapability();
  const sampleModeBlocked: boolean =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canEditRouting: boolean = canMutateRouting && !sampleModeBlocked;
  const routingQuery = useAlertRoutingSubscriptionsQuery();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  // Keep reportTabLoaded off the refresh dependency list — stamping freshness recreates
  // the context value and would otherwise retrigger effects in a loop.
  const reportTabLoadedRef = useRef(refreshContext?.reportTabLoaded);
  reportTabLoadedRef.current = refreshContext?.reportTabLoaded;
  const registerTabLoader = refreshContext?.registerTabLoader;
  const formSectionRef = useRef<HTMLElement | null>(null);
  const statusRegionId = useId();
  const items = routingQuery.items;
  const loading = routingQuery.loading;
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const failure = routingQuery.failure ?? mutationFailure;
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, AlertRoutingDeliveryAttempt[]>>({});
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AlertRoutingFieldErrors>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pendingDisable, setPendingDisable] = useState<AlertRoutingSubscriptionDisableTarget | null>(null);
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableErrorMessage, setDisableErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
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

  const deliveryHealth = useMemo(() => summarizeAlertRoutingDeliveryHealth(items), [items]);
  const isEmptyComposition: boolean = !loading && items.length === 0;
  const mutationDisabledReason = canMutateRouting ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "alert-routing-mutate-disabled-hint";

  const configProvenanceLabel = useMemo(() => {
    const change = latestAlertRoutingConfigChange(items);

    if (change === null) {
      return null;
    }

    return formatAlertRoutingConfigProvenanceLine(change.recordedUtc, change.actor);
  }, [items]);

  const refreshRoutingTab = useCallback(async () => {
    await routingQuery.refresh();
  }, [routingQuery.refresh]);

  useEffect(() => {
    if (registerTabLoader === undefined) {
      return;
    }

    return registerTabLoader("notifications", refreshRoutingTab);
  }, [refreshRoutingTab, registerTabLoader]);

  useEffect(() => {
    if (loading || routingQuery.failure !== null) {
      return;
    }

    reportTabLoadedRef.current?.("notifications", items.length);
  }, [items.length, loading, routingQuery.failure]);

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
    if (!canEditRouting || creating) {
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
      setStatusMessage("Notification destination created.");
      await routingQuery.refresh();
    } catch (e) {
      setMutationFailure(toApiLoadFailure(e));
      setStatusMessage("Could not create the notification destination.");
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(
    id: string,
    isEnabled: boolean,
    subscriptionName: string,
    channelTypeValue: string,
  ) {
    if (!canEditRouting) {
      return;
    }

    if (isEnabled) {
      setDisableErrorMessage(null);
      setPendingDisable({
        routingSubscriptionId: id,
        subscriptionName,
        channel: channelTypeValue === "SlackWebhook" ? "slack" : "webhook",
      });

      return;
    }

    await executeToggle(id);
  }

  async function executeToggle(id: string): Promise<void> {
    setMutationFailure(null);

    try {
      await toggleAlertRoutingSubscription(id);
      await routingQuery.refresh();
    } catch (e) {
      setMutationFailure(toApiLoadFailure(e));
      throw e;
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
      setDisableErrorMessage(apiFailure.message);
    } finally {
      setDisableBusy(false);
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
    <div className={cn(isEmptyComposition ? "max-w-4xl space-y-4" : "space-y-8")}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Notification delivery</h2>
          {deliveryHealth !== null ? (
            <StatusTag
              kind={deliveryHealth.kind}
              label={deliveryHealth.label}
              data-testid="alert-routing-delivery-health"
            />
          ) : null}
        </div>
        <p className={cn("m-0 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {pageLead}
        </p>
        {sampleModeBlocked ? (
          <div
            role="status"
            className={cn(DESIGN_TOKENS.callout.warn, "p-4")}
            data-testid="alert-routing-sample-mode-banner"
          >
            <p className={cn("mb-2", OPERATOR_TYPOGRAPHY.body)}>{ALERT_RULES_SAMPLE_MODE_BANNER}</p>
            <Link href={ALERT_RULES_SAMPLE_MODE_CTA_HREF} className="font-medium underline underline-offset-2">
              {ALERT_RULES_SAMPLE_MODE_CTA_LABEL}
            </Link>
          </div>
        ) : null}
        {!canEditRouting && !sampleModeBlocked ? <OperateExecutePageHint /> : null}
        {configProvenanceLabel !== null ? (
          <p
            className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="alert-routing-config-provenance"
          >
            {configProvenanceLabel}{" "}
            <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.inline}>
              View audit trail
            </Link>
          </p>
        ) : null}
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

      {!isEmptyComposition ? (
        <section aria-labelledby="alert-routing-destinations-heading" className="space-y-4">
          <h3 id="alert-routing-destinations-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Notification destinations
          </h3>
          <AlertRoutingDestinationList
            items={items}
            attemptsBySub={attemptsBySub}
            canMutateRouting={canEditRouting}
            testingId={testingId}
            onAddDestination={scrollToForm}
            onToggle={(id, isEnabled, subscriptionName, channelTypeValue) =>
              void onToggle(id, isEnabled, subscriptionName, channelTypeValue)
            }
            onLoadAttempts={(id) => void loadAttempts(id)}
            onTest={(id) => void onTest(id)}
          />
        </section>
      ) : null}

      <div
        className={cn(isEmptyComposition && "space-y-4")}
        data-testid={isEmptyComposition ? "alert-routing-empty-state" : undefined}
      >
        <section
          ref={formSectionRef}
          tabIndex={-1}
          aria-labelledby="alert-routing-form-heading"
          className={cn(
            "space-y-6 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950",
            !canEditRouting && "opacity-90",
          )}
        >
          <h3 id="alert-routing-form-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {isEmptyComposition ? "Set up alert delivery" : "Add another destination"}
          </h3>
          {isEmptyComposition ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Create your first email or webhook destination. Qualifying findings notify your team when severity
              thresholds are met.
            </p>
          ) : null}

        <fieldset className="space-y-4 border-0 p-0" disabled={!canEditRouting}>
          <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Destination name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ALERT_ROUTING_DESTINATION_NAME_PLACEHOLDER}
              disabled={!canEditRouting || creating}
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
              disabled={!canEditRouting || creating}
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
              disabled={!canEditRouting || creating}
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

        <fieldset className="space-y-3 border-0 p-0" disabled={!canEditRouting}>
          <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            Alert threshold
          </p>
          <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Minimum severity
            <select
              value={minimumSeverity}
              onChange={(e) => setMinimumSeverity(e.target.value)}
              disabled={!canEditRouting || creating}
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
              className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
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
          disabled={!canEditRouting || creating}
        />

        <div className="flex flex-col items-start gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="primary"
            onClick={() => void onCreate(false)}
            disabled={!canEditRouting || creating || !formValid}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            data-testid="alert-routing-create-destination"
          >
            {creating ? "Creating destination…" : canMutateRouting ? "Create notification destination" : alertRoutingCreateSubscriptionButtonLabelReaderRank}
          </Button>
          {isWebhookChannelType(channelType) ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void onCreate(true)}
              disabled={!canEditRouting || creating || !formValid}
            >
              {creating ? "Working…" : "Send test notification"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setName("");
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
          <WhyDisabledCtaHint
            id={mutationDisabledHintId}
            reason={mutationDisabledReason}
            testId="alert-routing-mutate-disabled-hint"
          />
        </div>
      </section>

        {isEmptyComposition ? (
          <GettingStartedSteps
            {...(canMutateRouting ? alertRoutingEmptyGettingStartedOperator : alertRoutingEmptyGettingStartedReader)}
            className="border-0 bg-transparent px-0 py-0"
            stepLinkByIndex={
              canMutateRouting
                ? {
                    3: {
                      href: governanceAlertRulesTabHref("test-alerts"),
                      label: "Test alerts",
                    },
                  }
                : undefined
            }
          />
        ) : null}
      </div>

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
    </div>
  );
}
