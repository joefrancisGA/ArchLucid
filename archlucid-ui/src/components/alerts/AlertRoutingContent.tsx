"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperateExecutePageHint } from "@/components/OperateCapabilityHints";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { AlertRoutingPickReviewBeforeRoutingStrip } from "@/components/alerts/AlertRoutingPickReviewBeforeRoutingStrip";
import { AlertRoutingNextReviewFooterClient } from "@/components/alerts/AlertRoutingNextReviewFooterClient";
import { AlertRoutingCreateForm } from "@/components/alerts/AlertRoutingCreateForm";
import { AlertRoutingSubscriptionsList } from "@/components/alerts/AlertRoutingSubscriptionsList";
import { AlertRoutingSubscriptionDisableDialog } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ALERT_RULES_SAMPLE_MODE_BANNER,
  ALERT_RULES_SAMPLE_MODE_CTA_HREF,
  ALERT_RULES_SAMPLE_MODE_CTA_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_AUDIT_PATH,
  governanceAlertRulesTabHref,
} from "@/lib/governance/governance-route-paths";
import { useAlertRoutingContent } from "@/components/alerts/use-alert-routing-content";

export function AlertRoutingContent() {
  const routing = useAlertRoutingContent();

  return (
    <div className={cn(routing.isEmptyComposition ? "max-w-4xl space-y-4" : "space-y-8")}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Notification delivery</h2>
          {routing.deliveryHealth !== null ? (
            <StatusTag
              kind={routing.deliveryHealth.kind}
              label={routing.deliveryHealth.label}
              data-testid="alert-routing-delivery-health"
            />
          ) : null}
        </div>
        <p className={cn("m-0 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {routing.pageLead}
        </p>
        {routing.sampleModeBlocked ? (
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
        {!routing.canEditRouting && !routing.sampleModeBlocked ? <OperateExecutePageHint /> : null}
        {routing.configProvenanceLabel !== null ? (
          <p
            className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="alert-routing-config-provenance"
          >
            {routing.configProvenanceLabel}{" "}
            <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.optional}>
              View audit trail
            </Link>
          </p>
        ) : null}
        <AlertOperatorToolingRankCue />
      </header>

      <div id={routing.statusRegionId} role="status" aria-live="polite" className="sr-only">
        {routing.statusMessage}
      </div>

      {routing.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={routing.failure.problem}
            fallbackMessage={routing.failure.message}
            correlationId={routing.failure.correlationId}
          />
        </div>
      ) : null}

      {!routing.isEmptyComposition ? (
        <AlertRoutingSubscriptionsList
          items={routing.items}
          attemptsBySub={routing.attemptsBySub}
          canEditRouting={routing.canEditRouting}
          testingId={routing.testingId}
          continueLastSubscription={routing.continueLastSubscription}
          onAddDestination={routing.scrollToForm}
          onToggle={(id, isEnabled, subscriptionName, channelTypeValue) => {
            void routing.onToggle(id, isEnabled, subscriptionName, channelTypeValue);
          }}
          onLoadAttempts={(id) => {
            void routing.loadAttempts(id);
          }}
          onTest={(id) => {
            void routing.onTest(id);
          }}
          onOpenSubscription={routing.openSubscription}
        />
      ) : null}

      {!routing.scopedRunFilterActive ? (
        <AlertRoutingPickReviewBeforeRoutingStrip
          selectedReviewId=""
          onSelectReview={routing.onPickReviewForRouting}
        />
      ) : (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-routing-run-scope-banner"
        >
          {"Routing destinations scoped to review "}
          <span className="font-mono text-al-text-primary">{routing.scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("notifications")}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(routing.scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      )}

      {routing.scopedRunFilterActive ? (
        <AlertRoutingCreateForm
          formSectionRef={routing.formSectionRef}
          isEmptyComposition={routing.isEmptyComposition}
          canEditRouting={routing.canEditRouting}
          canMutateRouting={routing.canMutateRouting}
          creating={routing.creating}
          formValid={routing.formValid}
          name={routing.name}
          channelType={routing.channelType}
          destination={routing.destination}
          minimumSeverity={routing.minimumSeverity}
          routingCriteria={routing.routingCriteria}
          fieldErrors={routing.fieldErrors}
          thresholdPreview={routing.thresholdPreview}
          alertRoutingCreateSteps={routing.alertRoutingCreateSteps}
          alertRoutingCreateEmphasizedStepId={routing.alertRoutingCreateEmphasizedStepId}
          mutationDisabledReason={routing.mutationDisabledReason}
          mutationDisabledHintId={routing.mutationDisabledHintId}
          onNameChange={routing.setName}
          onChannelTypeChange={routing.onChannelTypeChange}
          onDestinationChange={routing.setDestination}
          onMinimumSeverityChange={routing.setMinimumSeverity}
          onRoutingCriteriaChange={routing.setRoutingCriteria}
          onCreate={(sendTestAfterSave) => {
            void routing.onCreate(sendTestAfterSave);
          }}
          onResetForm={routing.resetCreateForm}
        />
      ) : null}

      <AlertRoutingSubscriptionDisableDialog
        target={routing.pendingDisable}
        busy={routing.disableBusy}
        errorMessage={routing.disableErrorMessage}
        onCancel={routing.cancelDisableDialog}
        onConfirm={() => {
          void routing.confirmDisableSubscription();
        }}
      />

      {routing.scopedRunFilterActive ? (
        <AlertRoutingNextReviewFooterClient runId={routing.scopedRunId} />
      ) : null}
    </div>
  );
}
