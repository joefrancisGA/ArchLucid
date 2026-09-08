"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { AlertRulesBuyerChrome } from "@/components/alerts/AlertRulesBuyerChrome";
import { AlertRulesCreateForm } from "@/components/alerts/AlertRulesCreateForm";
import { AlertRulesPickReviewBeforeCreatingStrip } from "@/components/alerts/AlertRulesPickReviewBeforeCreatingStrip";
import { AlertRulesNextReviewFooterClient } from "@/components/alerts/AlertRulesNextReviewFooterClient";
import { AlertRulesTable } from "@/components/alerts/AlertRulesTable";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { AlertRuleLivePreviewPanel } from "@/components/alerts/AlertRuleLivePreviewPanel";
import { AlertRuleNotificationReadinessPanel } from "@/components/alerts/AlertRuleNotificationReadinessPanel";
import { AlertRuleSimulateModal } from "@/components/alerts/AlertRuleSimulateModal";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { Button } from "@/components/ui/button";
import { LivelihoodDocumentGuardDialog } from "@/hooks/use-livelihood-document-guards";
import { useAlertRulesContentList } from "@/components/alerts/use-alert-rules-content-list";
import { useAlertRulesContentCreate } from "@/components/alerts/use-alert-rules-content-create";
import { useAlertRulesContentPreview } from "@/components/alerts/use-alert-rules-content-preview";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER,
  ALERT_RULES_CONDITIONS_PAGE_LEAD,
  ALERT_RULES_CREATE_BUTTON_LABEL,
  ALERT_RULES_SAMPLE_MODE_BANNER,
  ALERT_RULES_SAMPLE_MODE_CTA_HREF,
  ALERT_RULES_SAMPLE_MODE_CTA_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import { OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND } from "@/lib/operator/operator-live-preview-readiness-rail";

export function AlertRulesContent() {
  const buyerPolishedShell = useProductionEvalChrome();
  const list = useAlertRulesContentList();
  const create = useAlertRulesContentCreate({
    canEdit: list.canEdit,
    canMutateAlertRules: list.canMutateAlertRules,
    items: list.items,
    loading: list.loading,
    scopedRunFilterActive: list.scopedRunFilterActive,
    isEmpty: list.isEmpty,
    load: list.load,
    didFocusEmptyIntroRef: list.didFocusEmptyIntroRef,
  });
  const preview = useAlertRulesContentPreview({
    items: list.items,
    formInput: create.formInput,
    routingSubscriptions: list.routingSubscriptions,
  });

  const failure = list.listFailure ?? create.mutationFailure;
  const sectionGap = preview.pinLivePreviewRail ? "gap-8" : "gap-4";

  const emptyStateFooter = list.canEdit && list.scopedRunFilterActive && create.emptyIntroMode && !buyerPolishedShell ? (
    <div className="flex flex-wrap items-center gap-2" data-testid="alert-rules-empty-footer">
      <Button
        type="button"
        variant="primary"
        data-testid="alert-rules-create-action"
        onClick={() => create.setShowCreatePanel(true)}
      >
        {ALERT_RULES_CREATE_BUTTON_LABEL}
      </Button>
      <MutatingInWorkspaceChip />
    </div>
  ) : null;

  return (
    <div className="min-w-0">
      {list.sampleModeBlocked ? (
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

      {buyerPolishedShell ? null : <AlertOperatorToolingRankCue />}

      {buyerPolishedShell ? (
        <div
          className="mb-4 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
          data-testid="alert-rules-conditions-first-viewport"
        >
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="alert-rules-conditions-intro"
          >
            {ALERT_RULES_CONDITIONS_PAGE_LEAD}
          </p>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="alert-rules-conditions-buyer-start-here-helper"
          >
            {ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER}
          </p>
        </div>
      ) : null}

      <div
        id={list.statusRegionId}
        role="status"
        aria-live="polite"
        aria-label={list.statusRegionLabel}
        className="sr-only"
      >
        {create.statusMessage}
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

      {!list.scopedRunFilterActive ? (
        <AlertRulesPickReviewBeforeCreatingStrip
          selectedReviewId=""
          onSelectReview={list.onPickReviewForCreating}
        />
      ) : (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-rules-run-scope-banner"
        >
          {"Creating rules scoped to review "}
          <span className="font-mono text-al-text-primary">{list.scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("rules")}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(list.scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      )}

      <div
        className={cn(
          "grid",
          sectionGap,
          preview.pinLivePreviewRail && "xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]",
        )}
        data-testid="alert-rules-layout"
        data-rail-kind={OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND}
        data-live-rail-pinned={preview.pinLivePreviewRail ? "true" : "false"}
        data-empty-intro={list.showEmptyCard && list.canEdit ? "true" : "false"}
      >
        <div className={cn("flex min-w-0 flex-col", sectionGap)}>
          <AlertRulesTable
            listInitialLoading={list.listInitialLoading}
            items={list.items}
            continueLastRule={list.continueLastRule}
            routingSubscriptions={list.routingSubscriptions}
            showEmptyCard={list.showEmptyCard}
            emptyStateDescription={list.emptyStateDescription}
            emptyStateFooter={emptyStateFooter}
            onOpenRule={list.openRule}
            onSimulate={(selected) => {
              list.rememberRule(selected.ruleId);
              list.setSimulateForRule(selected);
            }}
          />

          {create.showCreateForm ? (
            <AlertRulesCreateForm
              canEdit={list.canEdit}
              loading={list.loading}
              creating={create.creating}
              formValid={create.formValid}
              fieldErrors={create.fieldErrors}
              fieldTouched={create.fieldTouched}
              setFieldTouched={create.setFieldTouched}
              name={create.name}
              setName={create.setName}
              ruleType={create.ruleType}
              setRuleType={create.setRuleType}
              alertPriority={create.alertPriority}
              setAlertPriority={create.setAlertPriority}
              threshold={create.threshold}
              setThreshold={create.setThreshold}
              thresholdStep={create.thresholdStep}
              nameInputRef={create.nameInputRef}
              alertRulesCreateSteps={create.alertRulesCreateSteps}
              alertRulesCreateEmphasizedStepId={create.alertRulesCreateEmphasizedStepId}
              mutationDisabledReason={create.mutationDisabledReason}
              mutationDisabledHintId={create.mutationDisabledHintId}
              onCreate={() => {
                void create.onCreate();
              }}
            />
          ) : null}
        </div>

        {preview.pinLivePreviewRail ? (
          <div className="grid min-w-0 gap-4">
            <AlertRuleLivePreviewPanel form={preview.formInput} />
            <AlertRuleNotificationReadinessPanel
              scopeRule={preview.scopePreviewRule}
              readinessRule={preview.draftReadinessRule}
              routingSubscriptions={preview.routingSubscriptions}
              draftForm={preview.formInput}
            />
          </div>
        ) : null}
      </div>

      <AlertRuleSimulateModal
        rule={list.simulateForRule}
        open={list.simulateForRule !== null}
        onOpenChange={(next) => {
          if (!next) {
            list.setSimulateForRule(null);
          }
        }}
      />

      {list.scopedRunFilterActive ? (
        <AlertRulesNextReviewFooterClient runId={list.scopedRunId} />
      ) : null}
      <AlertRulesBuyerChrome />
      <LivelihoodDocumentGuardDialog
        open={create.documentGuards.dialogOpen}
        message={create.documentGuards.dialogMessage}
        onConfirmLeave={create.documentGuards.confirmLeave}
        onCancelLeave={create.documentGuards.cancelLeave}
      />
    </div>
  );
}
