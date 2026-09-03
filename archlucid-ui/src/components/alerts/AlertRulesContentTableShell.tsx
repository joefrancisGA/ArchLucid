"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { AlertRulesCreateForm } from "@/components/alerts/AlertRulesCreateForm";
import { AlertRulesPickReviewBeforeCreatingStrip } from "@/components/alerts/AlertRulesPickReviewBeforeCreatingStrip";
import { AlertRulesNextReviewFooterClient } from "@/components/alerts/AlertRulesNextReviewFooterClient";
import { AlertRulesTable } from "@/components/alerts/AlertRulesTable";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { AlertRuleLivePreviewPanel } from "@/components/alerts/AlertRuleLivePreviewPanel";
import { AlertRuleNotificationReadinessPanel } from "@/components/alerts/AlertRuleNotificationReadinessPanel";
import { AlertRuleSimulateModal } from "@/components/alerts/AlertRuleSimulateModal";
import {
  ALERT_RULES_SAMPLE_MODE_BANNER,
  ALERT_RULES_SAMPLE_MODE_CTA_HREF,
  ALERT_RULES_SAMPLE_MODE_CTA_LABEL,
  ALERT_RULES_STATUS_LIVE_REGION_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import {
  OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND,
} from "@/lib/operator/operator-live-preview-readiness-rail";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";

import type { AlertRulesContentViewModel } from "./use-alert-rules-content-state";

export type AlertRulesContentTableShellProps = AlertRulesContentViewModel;

export function AlertRulesContentTableShell(props: AlertRulesContentTableShellProps) {
  const {
    scopedRunId,
    scopedRunFilterActive,
    onPickReviewForCreating,
    sampleModeBlocked,
    statusRegionId,
    statusMessage,
    failure,
    canEdit,
    items,
    continueLastRule,
    routingSubscriptions,
    listInitialLoading,
    showEmptyCard,
    showCreateForm,
    sectionGap,
    pinLivePreviewRail,
    emptyStateDescription,
    emptyStateFooter,
    openRule,
    rememberRule,
    simulateForRule,
    setSimulateForRule,
    creating,
    loading,
    formValid,
    fieldErrors,
    fieldTouched,
    setFieldTouched,
    name,
    setName,
    ruleType,
    setRuleType,
    alertPriority,
    setAlertPriority,
    threshold,
    setThreshold,
    thresholdStep,
    nameInputRef,
    alertRulesCreateSteps,
    alertRulesCreateEmphasizedStepId,
    mutationDisabledReason,
    mutationDisabledHintId,
    onCreate,
    formInput,
    scopePreviewRule,
    draftReadinessRule,
  } = props;

  return (
    <div className="min-w-0">
      {sampleModeBlocked ? (
        <div
          role="status"
          className={cn("mb-4", DESIGN_TOKENS.callout.warn, "p-4")}
        >
          <p className={cn("mb-2", OPERATOR_TYPOGRAPHY.body)}>{ALERT_RULES_SAMPLE_MODE_BANNER}</p>
          <Link href={ALERT_RULES_SAMPLE_MODE_CTA_HREF} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            {ALERT_RULES_SAMPLE_MODE_CTA_LABEL}
          </Link>
        </div>
      ) : null}

      <AlertOperatorToolingRankCue />

      <div
        id={statusRegionId}
        role="status"
        aria-live="polite"
        aria-label={ALERT_RULES_STATUS_LIVE_REGION_LABEL}
        className="sr-only"
      >
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

      {!scopedRunFilterActive ? (
        <AlertRulesPickReviewBeforeCreatingStrip selectedReviewId="" onSelectReview={onPickReviewForCreating} />
      ) : (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-rules-run-scope-banner"
        >
          {"Creating rules scoped to review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("rules")}>
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
        className={cn(
          "grid",
          sectionGap,
          pinLivePreviewRail && "xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]",
        )}
        data-testid="alert-rules-layout"
        data-rail-kind={OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND}
        data-live-rail-pinned={pinLivePreviewRail ? "true" : "false"}
        data-empty-intro={showEmptyCard && canEdit ? "true" : "false"}
      >
        <div className={cn("flex min-w-0 flex-col", sectionGap)}>
          <AlertRulesTable
            listInitialLoading={listInitialLoading}
            items={items}
            continueLastRule={continueLastRule}
            routingSubscriptions={routingSubscriptions}
            showEmptyCard={showEmptyCard}
            emptyStateDescription={emptyStateDescription}
            emptyStateFooter={emptyStateFooter}
            onOpenRule={openRule}
            onSimulate={(selected) => {
              rememberRule(selected.ruleId);
              setSimulateForRule(selected);
            }}
          />

          {showCreateForm ? (
            <AlertRulesCreateForm
              canEdit={canEdit}
              loading={loading}
              creating={creating}
              formValid={formValid}
              fieldErrors={fieldErrors}
              fieldTouched={fieldTouched}
              setFieldTouched={setFieldTouched}
              name={name}
              setName={setName}
              ruleType={ruleType}
              setRuleType={setRuleType}
              alertPriority={alertPriority}
              setAlertPriority={setAlertPriority}
              threshold={threshold}
              setThreshold={setThreshold}
              thresholdStep={thresholdStep}
              nameInputRef={nameInputRef}
              alertRulesCreateSteps={alertRulesCreateSteps}
              alertRulesCreateEmphasizedStepId={alertRulesCreateEmphasizedStepId}
              mutationDisabledReason={mutationDisabledReason}
              mutationDisabledHintId={mutationDisabledHintId}
              onCreate={() => {
                void onCreate();
              }}
            />
          ) : null}
        </div>

        {pinLivePreviewRail ? (
          <div className="grid min-w-0 gap-4">
            <AlertRuleLivePreviewPanel form={formInput} />
            <AlertRuleNotificationReadinessPanel
              scopeRule={scopePreviewRule}
              readinessRule={draftReadinessRule}
              routingSubscriptions={routingSubscriptions}
              draftForm={formInput}
            />
          </div>
        ) : null}
      </div>

      <AlertRuleSimulateModal
        rule={simulateForRule}
        open={simulateForRule !== null}
        onOpenChange={(next) => {
          if (!next) {
            setSimulateForRule(null);
          }
        }}
      />

      {scopedRunFilterActive ? <AlertRulesNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
