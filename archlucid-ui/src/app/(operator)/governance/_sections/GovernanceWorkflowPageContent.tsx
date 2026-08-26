"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { MutationErrorBoundary } from "@/components/MutationErrorBoundary";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Separator } from "@/components/ui/separator";
import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import {
  GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER,
  GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
  GOVERNANCE_OVERVIEW_SAMPLE_OVERVIEW_LINE,
  GOVERNANCE_OVERVIEW_WORKSPACE_HEALTH_LINK_LABEL,
} from "@/lib/governance/governance-overview-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL } from "@/lib/governance/governance-workflow-release-copy";
import { STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS } from "@/lib/operator/operator-static-demo";
import {
  AdvancedOptionsAccordionDeferred,
  CtoDemoBuyerValueStripDeferred,
  CtoDemoGovernancePreviewHintDeferred,
  CtoDemoSegregationCalloutDeferred,
  GovernanceApprovalStoryCardDeferred,
  GovernanceOverviewPanelDeferred,
  GovernanceReviewContextBarDeferred,
  GovernanceWorkflowApprovalsListDeferred,
  GovernanceWorkflowPromotionsActivationsSectionDeferred,
  GovernanceWorkflowSubmitSectionDeferred,
} from "./governance-workflow-deferred-chunks";
import type { FocusSubmitSectionResult } from "./governance-focus-submit-result";
import { GovernanceWorkflowMutationHost } from "./GovernanceWorkflowMutationHost";
import { GovernanceApprovalQueueNextReviewFooterClient } from "./GovernanceApprovalQueueNextReviewFooterClient";
import { GovernanceApprovalQueuePickReviewBeforeSubmittingStrip } from "./GovernanceApprovalQueuePickReviewBeforeSubmittingStrip";
import {
  GOVERNANCE_APPROVAL_DECISION_RECORD_TITLE,
  GOVERNANCE_APPROVAL_REQUESTS_COMPACT_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_TITLE,
} from "@/lib/governance/governance-workflow-section-copy";
import { useGovernanceWorkflowPage } from "./use-governance-workflow-page";

export type { FocusSubmitSectionResult } from "./governance-focus-submit-result";

export function GovernanceWorkflowPageContent() {
  const {
    canMutateWorkflow,
    buyerPolishedShell,
    submitSectionRef,
    approvalsSectionRef,
    submitRunId,
    setSubmitRunId,
    submitManifestVersion,
    setSubmitManifestVersion,
    submitSource,
    setSubmitSource,
    submitTarget,
    setSubmitTarget,
    submitComment,
    setSubmitComment,
    queryRunId,
    setQueryRunId,
    activeRunId,
    workflowActor,
    setWorkflowActor,
    approvals,
    promotions,
    activations,
    showingStaticDemoGovernanceRecords,
    listFailure,
    listsLoading,
    activeReviewDisplayTitle,
    mutations,
    submitBusy,
    submitApprovalComplete,
    reviewBusy,
    activateBusyId,
    pendingReview,
    setPendingReview,
    reviewedBy,
    setReviewedBy,
    reviewComment,
    setReviewComment,
    pendingPromote,
    setPendingPromote,
    pendingPromoteRequestRef,
    pendingActivate,
    setPendingActivate,
    pendingActivatePromotionRef,
    onSubmitApproval,
    onConfirmReview,
    refreshIfActive,
    isReviewContext,
    urlScopedRunId,
    isShowcaseSampleContext,
    showGovernanceSampleOverviewBanner,
    approvalWorkflowState,
    buyerSuppressGovernanceSubmitChrome,
    listsLoadingShowsBusyChrome,
    clearReviewContext,
    onLoadRun,
    focusPendingApprovals,
    focusSubmitSection,
    showBuyerApprovalStory,
    workflowOutcomeLine,
    pageTitle,
    pageLead,
    replaceApprovalQueueUrl,
  } = useGovernanceWorkflowPage();

  const overviewHeaderActions = (
    <div className="flex flex-wrap items-center gap-2" data-testid="governance-overview-header-actions">
      <PageContextualHelpButton />
      {!isReviewContext ? (
        <Link
          href={GOVERNANCE_WORKSPACE_HEALTH_HREF}
          className={OPERATOR_LINK.optional}
          data-testid="governance-overview-workspace-health-link"
        >
          {GOVERNANCE_OVERVIEW_WORKSPACE_HEALTH_LINK_LABEL}
        </Link>
      ) : null}
    </div>
  );

  return (
    <MutationErrorBoundary title="Governance workflow failed to render">
    <TooltipProvider delayDuration={300}>
    <OperatorPageContainer variant="workflow">
      <OperatorPageHeader
        navHref="/governance/approval-queue"
        title={pageTitle}
        titleTestId="governance-overview-page-title"
        subtitle={pageLead}
        metadata={
          !isReviewContext && !buyerPolishedShell ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <InlineGuidanceLabel label="Next" testId="inline-guidance-governance-overview-next" />{" "}
              {GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION}
            </span>
          ) : buyerPolishedShell && isReviewContext && !showBuyerApprovalStory ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Production deployments and change-managed releases follow your enterprise proces — his page does not configure
              releases.
            </span>
          ) : null
        }
        actions={overviewHeaderActions}
      />

      <LayerHeader
        pageKey="governance-workflow"
        density="compact"
        collapsibleGuidance={GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER}
      />

      {showGovernanceSampleOverviewBanner ? (
        <p
          className={cn(
            "mb-4",
            DESIGN_TOKENS.callout.warn,
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="governance-sample-overview-banner"
        >
          <strong>{GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL}.</strong> {GOVERNANCE_OVERVIEW_SAMPLE_OVERVIEW_LINE}
        </p>
      ) : null}

      {isReviewContext ? <CtoDemoBuyerValueStripDeferred stepIndex={3} /> : null}
      {isReviewContext ? <CtoDemoSegregationCalloutDeferred /> : null}
      {isReviewContext ? <CtoDemoGovernancePreviewHintDeferred /> : null}

      {isReviewContext ? <GovernanceJobRouterStrip currentJobId="approve-governance" /> : null}

      <GovernanceWorkflowMutationHost mutations={mutations} />

      {!isReviewContext ? (
        urlScopedRunId.length === 0 ? (
          <GovernanceApprovalQueuePickReviewBeforeSubmittingStrip
            selectedReviewId=""
            onSelectReview={(reviewId) => {
              replaceApprovalQueueUrl(reviewId);
            }}
          />
        ) : (
          <GovernanceOverviewPanelDeferred
            buyerPolishedShell={buyerPolishedShell}
            canMutateWorkflow={canMutateWorkflow}
            queryRunId={queryRunId}
            setQueryRunId={setQueryRunId}
            onLoadReview={onLoadRun}
            onFocusSubmit={focusSubmitSection}
            onFocusPending={focusPendingApprovals}
            listsLoading={listsLoading}
            hubScopedRunId={urlScopedRunId}
          />
        )
      ) : null}

      {isReviewContext && activeRunId !== null ? (
        <>
          {isShowcaseSampleContext ? (
            <p
              className={cn(
                "mb-4",
                DESIGN_TOKENS.callout.warn,
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="governance-sample-context-banner"
            >
              <strong>{GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL}.</strong> {GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE}
            </p>
          ) : null}

          <GovernanceReviewContextBarDeferred
            activeRunId={activeRunId}
            reviewDisplayTitle={activeReviewDisplayTitle}
            buyerPolishedShell={buyerPolishedShell}
            canMutateWorkflow={canMutateWorkflow}
            listsLoading={listsLoading}
            listsLoadingShowsBusyChrome={listsLoadingShowsBusyChrome}
            workflowActor={workflowActor}
            setWorkflowActor={setWorkflowActor}
            onBackToOverview={clearReviewContext}
            onRefresh={() => {
              void refreshIfActive();
            }}
          />

          {listFailure !== null ? (
            <div className="mb-6" role="alert">
              <OperatorApiProblem
                problem={listFailure.problem}
                fallbackMessage={listFailure.message}
                correlationId={listFailure.correlationId}
              />
            </div>
          ) : null}

          {showBuyerApprovalStory ? (
            <>
              <p
                className={cn("mb-4 max-w-prose rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 font-semibold leading-snug shadow-sm dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
                data-testid="governance-buyer-approval-record-lead"
              >
                {BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD}
              </p>
              <GovernanceApprovalStoryCardDeferred
                row={approvalWorkflowState.primaryApprovedRequest!}
                auditTrailHref={auditTrailNavHref(activeRunId)}
                emphasizeComplete
                decisionRecordTitle={GOVERNANCE_APPROVAL_DECISION_RECORD_TITLE}
              />
            </>
          ) : workflowOutcomeLine !== null ? (
            <p
              className={cn("mb-4 max-w-prose rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.body)}
              data-testid="governance-workflow-outcome-banner"
            >
              {workflowOutcomeLine}
            </p>
          ) : null}

          <div
            className={cn("flex flex-col gap-10", !canMutateWorkflow && "flex-col-reverse")}
            data-testid="governance-workflow-review-context-stack"
          >
          <div ref={submitSectionRef}>
            <GovernanceWorkflowSubmitSectionDeferred
              buyerPolishedShell={buyerPolishedShell}
              buyerSuppressGovernanceSubmitChrome={buyerSuppressGovernanceSubmitChrome}
              canMutateWorkflow={canMutateWorkflow}
              hideGovernanceQueryLoadCard
              preferAutoPick={false}
              submitRunId={submitRunId}
              setSubmitRunId={setSubmitRunId}
              submitManifestVersion={submitManifestVersion}
              setSubmitManifestVersion={setSubmitManifestVersion}
              submitSource={submitSource}
              setSubmitSource={setSubmitSource}
              submitTarget={submitTarget}
              setSubmitTarget={setSubmitTarget}
              submitComment={submitComment}
              setSubmitComment={setSubmitComment}
              submitBusy={submitBusy}
              submitApprovalComplete={submitApprovalComplete}
              onSubmitApproval={onSubmitApproval}
            />
          </div>

          <Separator className="mb-10" />

          <section
            ref={approvalsSectionRef}
            id="governance-approval-requests"
            className="mb-10"
            data-testid="governance-approval-requests-section"
          >
            {showingStaticDemoGovernanceRecords ? (
              <p
                role="status"
                data-testid="governance-static-demo-fallback-status"
                className={cn(
                  "mb-4",
                  DESIGN_TOKENS.callout.warn,
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS}
              </p>
            ) : null}
            <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {GOVERNANCE_APPROVAL_REQUESTS_SECTION_TITLE}
            </h3>
            <p className={cn("m-0 mt-2 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {showBuyerApprovalStory
                ? GOVERNANCE_APPROVAL_REQUESTS_COMPACT_SECTION_LEAD
                : GOVERNANCE_APPROVAL_REQUESTS_SECTION_LEAD}
            </p>
            <GovernanceWorkflowApprovalsListDeferred
              buyerPolishedShell={buyerPolishedShell}
              canMutateWorkflow={canMutateWorkflow}
              listsLoading={listsLoading}
              activeRunId={activeRunId}
              approvals={approvals}
              workflowState={approvalWorkflowState}
              listFailure={listFailure}
              emphasizeDecisionRecord={showBuyerApprovalStory}
              pendingReview={pendingReview}
              setPendingReview={setPendingReview}
              reviewedBy={reviewedBy}
              setReviewedBy={setReviewedBy}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
              reviewBusy={reviewBusy}
              onConfirmReview={onConfirmReview}
              workflowActor={workflowActor}
              refreshIfActive={refreshIfActive}
              pendingPromote={pendingPromote}
              setPendingPromote={setPendingPromote}
              pendingPromoteRequestRef={pendingPromoteRequestRef}
            />
          </section>

          {buyerPolishedShell ? null : (
            <>
              <Separator className="mb-10" />

              <div data-testid="governance-workflow-advanced-options">
                <AdvancedOptionsAccordionDeferred triggerLabel={GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL} className="mb-10">
                  <GovernanceWorkflowPromotionsActivationsSectionDeferred
                    canMutateWorkflow={canMutateWorkflow}
                    listsLoading={listsLoading}
                    activeRunId={activeRunId}
                    promotions={promotions}
                    activations={activations}
                    listFailure={listFailure}
                    workflowActor={workflowActor}
                    pendingActivate={pendingActivate}
                    setPendingActivate={setPendingActivate}
                    pendingActivatePromotionRef={pendingActivatePromotionRef}
                    activateBusyId={activateBusyId}
                  />
                </AdvancedOptionsAccordionDeferred>
              </div>
            </>
          )}
          </div>

          {activeRunId !== null && activeRunId.trim().length > 0 ? (
            <GovernanceApprovalQueueNextReviewFooterClient runId={activeRunId.trim()} />
          ) : null}
        </>
      ) : null}
    </OperatorPageContainer>
    </TooltipProvider>
    </MutationErrorBoundary>
  );
}
