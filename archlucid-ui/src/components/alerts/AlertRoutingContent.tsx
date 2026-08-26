"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperateExecutePageHint } from "@/components/OperateCapabilityHints";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { AlertRoutingCreateDestinationForm } from "@/components/alerts/AlertRoutingCreateDestinationForm";
import { AlertRoutingContinueLastViewedRow } from "@/components/alerts/AlertRoutingContinueLastViewedRow";
import { AlertRoutingPickReviewBeforeRoutingStrip } from "@/components/alerts/AlertRoutingPickReviewBeforeRoutingStrip";
import { AlertRoutingNextReviewFooterClient } from "@/components/alerts/AlertRoutingNextReviewFooterClient";
import { AlertRoutingDestinationList } from "@/components/alerts/AlertRoutingDestinationList";
import {
  AlertRoutingSubscriptionDisableDialog,
  type AlertRoutingSubscriptionDisableTarget,
} from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useAlertRoutingSubscriptionsQuery } from "@/components/alerts/use-alert-rules-hub-queries";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
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
  formatAlertRoutingThresholdPreview,
  isAlertRoutingDestinationFormValid,
  isWebhookChannelType,
  type AlertRoutingFieldErrors,
  validateAlertRoutingDestination,
  validateAlertRoutingName,
} from "@/lib/alert-routing-form";
import {
  resolveAlertRoutingCreateEmphasizedStepId,
  resolveAlertRoutingCreateSteps,
} from "@/lib/alert-routing-create-checklist";
import {
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
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_AUDIT_PATH,
  governanceAlertRulesTabHref,
} from "@/lib/governance/governance-route-paths";
import {
  resolveContinueLastAlertRoutingSubscription,
  writeAlertRoutingSubscriptionLastViewedId,
} from "@/lib/resolve-continue-last-alert-routing-subscription";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReviewForRouting = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "notifications");
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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
  const continueLastSubscription = useMemo(
    () => resolveContinueLastAlertRoutingSubscription(items),
    [items],
  );
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
  const alertRoutingCreateSteps = resolveAlertRoutingCreateSteps({
    channelConfigured: channelType.trim().length > 0,
    destinationConfigured: formValid,
    destinationSaved: items.length > 0,
  });
  const alertRoutingCreateEmphasizedStepId = resolveAlertRoutingCreateEmphasizedStepId({
    channelConfigured: channelType.trim().length > 0,
    destinationConfigured: formValid,
    destinationSaved: items.length > 0,
  });

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
      writeAlertRoutingSubscriptionLastViewedId(created.routingSubscriptionId);
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
    writeAlertRoutingSubscriptionLastViewedId(id);

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
    writeAlertRoutingSubscriptionLastViewedId(routingSubscriptionId);

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

    writeAlertRoutingSubscriptionLastViewedId(routingSubscriptionId);
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

  function rememberSubscription(subscriptionId: string): void {
    writeAlertRoutingSubscriptionLastViewedId(subscriptionId);
  }

  function openSubscription(subscriptionId: string): void {
    rememberSubscription(subscriptionId);
    document
      .querySelector(`[data-alert-routing-subscription-id="${subscriptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    void loadAttempts(subscriptionId);
  }

  function resetCreateForm(): void {
    setName("");
    setChannelType("Email");
    setDestination("");
    setMinimumSeverity("High");
    setRoutingCriteria({ ...EMPTY_ALERT_ROUTING_CRITERIA });
    setFieldErrors({});
    setStatusMessage("Form reset.");
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
            <Link href={ALERT_RULES_SAMPLE_MODE_CTA_HREF} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
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
            <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.optional}>
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
          {continueLastSubscription !== null ? (
            <AlertRoutingContinueLastViewedRow
              target={continueLastSubscription}
              onOpen={openSubscription}
            />
          ) : null}
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

      {!scopedRunFilterActive ? (
        <AlertRoutingPickReviewBeforeRoutingStrip selectedReviewId="" onSelectReview={onPickReviewForRouting} />
      ) : (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-routing-run-scope-banner"
        >
          {"Routing destinations scoped to review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("notifications")}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      )}

      <div
        className={cn(isEmptyComposition && "space-y-4")}
        data-testid={isEmptyComposition ? "alert-routing-empty-state" : undefined}
      >
        {scopedRunFilterActive ? (
          <AlertRoutingCreateDestinationForm
            formSectionRef={formSectionRef}
            isEmptyComposition={isEmptyComposition}
            canEditRouting={canEditRouting}
            canMutateRouting={canMutateRouting}
            creating={creating}
            formValid={formValid}
            name={name}
            channelType={channelType}
            destination={destination}
            minimumSeverity={minimumSeverity}
            routingCriteria={routingCriteria}
            fieldErrors={fieldErrors}
            thresholdPreview={thresholdPreview}
            alertRoutingCreateSteps={alertRoutingCreateSteps}
            alertRoutingCreateEmphasizedStepId={alertRoutingCreateEmphasizedStepId}
            mutationDisabledReason={mutationDisabledReason}
            mutationDisabledHintId={mutationDisabledHintId}
            onNameChange={setName}
            onChannelTypeChange={(value) => {
              setChannelType(value);
              setDestination("");
              setFieldErrors((prev) => ({ ...prev, destination: undefined }));
            }}
            onDestinationChange={setDestination}
            onMinimumSeverityChange={setMinimumSeverity}
            onRoutingCriteriaChange={setRoutingCriteria}
            onCreate={(sendTestAfterSave) => {
              void onCreate(sendTestAfterSave);
            }}
            onResetForm={resetCreateForm}
          />
        ) : null}

        {isEmptyComposition && scopedRunFilterActive ? (
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

      {scopedRunFilterActive ? <AlertRoutingNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
