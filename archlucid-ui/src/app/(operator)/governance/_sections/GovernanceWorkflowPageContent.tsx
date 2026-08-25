"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { MutationErrorBoundary } from "@/components/MutationErrorBoundary";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Separator } from "@/components/ui/separator";
import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { LayerHeader } from "@/components/LayerHeader";
import { useGovernanceReviewContextQuery } from "@/hooks/use-governance-review-context-query";
import { useGovernanceWorkflowMutations } from "@/hooks/use-governance-workflow-mutations";
import { useGovernanceWorkflowRunListsQuery } from "@/hooks/use-governance-workflow-run-lists-query";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  isStaticDemoPayloadFallbackEnabled,
  STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS,
  warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce,
} from "@/lib/operator/operator-static-demo";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import {
  GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER,
  GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION,
  GOVERNANCE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
  GOVERNANCE_OVERVIEW_SAMPLE_OVERVIEW_LINE,
  GOVERNANCE_OVERVIEW_WORKSPACE_HEALTH_LINK_LABEL,
  governanceOverviewPageLead,
  GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD,
} from "@/lib/governance/governance-overview-copy";
import { governanceApprovalQueueHref, GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import {
  BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD,
  BUYER_GOVERNANCE_GOVERNED_USE_SCOPE,
} from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_WORKFLOW_LOAD_REVIEW_REQUIRED } from "@/lib/governance/governance-mutation-outcome-copy";
import { GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL } from "@/lib/governance/governance-workflow-release-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { deriveGovernanceApprovalWorkflowState } from "./governance-approval-workflow-state";
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
import {
  GOVERNANCE_APPROVAL_DECISION_RECORD_TITLE,
  GOVERNANCE_APPROVAL_REQUESTS_COMPACT_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_TITLE,
  governanceWorkflowOutcomeLineForPhase,
} from "@/lib/governance/governance-workflow-section-copy";

export type { FocusSubmitSectionResult } from "./governance-focus-submit-result";

export function GovernanceWorkflowPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceRun = useWorkspaceActiveRun();
  const canMutateWorkflow = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const submitSectionRef = useRef<HTMLDivElement | null>(null);
  const approvalsSectionRef = useRef<HTMLElement | null>(null);
  const deepLinkFocusHandledRef = useRef<string | null>(null);
  const pendingOverviewSubmitScrollRunIdRef = useRef<string | null>(null);

  const [submitRunId, setSubmitRunId] = useState("");
  const [submitManifestVersion, setSubmitManifestVersion] = useState("");
  const [submitSource, setSubmitSource] = useState<string>("");
  const [submitTarget, setSubmitTarget] = useState<string>("");
  const [submitComment, setSubmitComment] = useState("");

  const [queryRunId, setQueryRunId] = useState("");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [workflowActor, setWorkflowActor] = useState("");

  const runListsQuery = useGovernanceWorkflowRunListsQuery(activeRunId);
  const reviewContextQuery = useGovernanceReviewContextQuery(activeRunId);

  const {
    approvals,
    promotions,
    activations,
    showingStaticDemoGovernanceRecords,
    listFailure,
    isPending: runListsPending,
    isFetching: runListsFetching,
    isFetched: runListsFetched,
    refetch: refetchRunLists,
  } = runListsQuery;

  const listsLoading = runListsPending || (runListsFetching && !runListsFetched);
  const activeReviewDisplayTitle = reviewContextQuery.data?.displayTitle ?? null;

  const mutations = useGovernanceWorkflowMutations({
    canMutateWorkflow,
    activeRunId,
    refetchRunLists,
    submitRunId,
    submitManifestVersion,
    submitSource,
    submitTarget,
    submitComment,
    setSubmitComment,
    workflowActor,
  });

  const {
    setMutationSuccessMessage,
    setMutationErrorMessage,
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
  } = mutations;

  const isReviewContext = activeRunId !== null;
  const isShowcaseSampleContext =
    isReviewContext &&
    canonicalizeDemoRunId(activeRunId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
  const showGovernanceSampleOverviewBanner =
    !isReviewContext && (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled());
  const approvalWorkflowState = deriveGovernanceApprovalWorkflowState({
    activeRunId,
    approvals,
    listsLoading,
  });

  const buyerSuppressGovernanceSubmitChrome =
    buyerPolishedShell && isReviewContext && approvalWorkflowState.canShowCompletionMessaging;

  const listsLoadingShowsBusyChrome = listsLoading && !(buyerPolishedShell && approvals.length > 0);

  const replaceApprovalQueueUrl = useCallback(
    (runId: string | null): void => {
      router.replace(governanceApprovalQueueHref(runId), { scroll: false });
    },
    [router],
  );

  const clearReviewContext = useCallback((): void => {
    setActiveRunId(null);
    setPendingReview(null);
    replaceApprovalQueueUrl(null);
  }, [replaceApprovalQueueUrl, setPendingReview]);

  useEffect(() => {
    warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce();
  }, []);

  const onLoadRun = useCallback(() => {
    const id = queryRunId.trim();

    if (!id) {
      setMutationErrorMessage(GOVERNANCE_WORKFLOW_LOAD_REVIEW_REQUIRED);
      setMutationSuccessMessage(null);

      return;
    }

    setActiveRunId(id);
    setSubmitRunId(id);
    setMutationErrorMessage(null);
    replaceApprovalQueueUrl(id);
  }, [queryRunId, replaceApprovalQueueUrl, setMutationErrorMessage, setMutationSuccessMessage]);

  useEffect(() => {
    const fromQuery = searchParams.get("runId")?.trim() ?? "";

    if (fromQuery.length > 0) {
      return;
    }

    const workspaceRunId = workspaceRun?.activeRunId?.trim() ?? "";

    if (workspaceRunId.length === 0 || queryRunId.trim().length > 0) {
      return;
    }

    setQueryRunId(workspaceRunId);
  }, [queryRunId, searchParams, workspaceRun?.activeRunId]);

  useEffect(() => {
    const fromQuery = searchParams.get("runId")?.trim() ?? "";

    if (fromQuery.length === 0) {
      return;
    }

    setQueryRunId(fromQuery);
    setActiveRunId(fromQuery);

    // Always adopt the deep-link runId into the submit form — preferAutoPick on the submit
    // section's AskRunIdPicker must not win the race and silently overwrite it afterward.
    setSubmitRunId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    const manifestVersion = reviewContextQuery.data?.manifestVersion?.trim() ?? "";

    if (manifestVersion.length > 0) {
      setSubmitManifestVersion(manifestVersion);
    }
  }, [reviewContextQuery.data?.manifestVersion]);

  useEffect(() => {
    const fromQuery = searchParams.get("runId")?.trim() ?? "";

    if (fromQuery.length === 0) {
      return;
    }

    if (listsLoading) {
      return;
    }

    if (activeRunId !== fromQuery) {
      return;
    }

    if (deepLinkFocusHandledRef.current === fromQuery) {
      return;
    }

    deepLinkFocusHandledRef.current = fromQuery;

    const phase = approvalWorkflowState.phase;
    const focusesApprovals =
      phase === "pending" || phase === "mixed" || phase === "approved" || phase === "rejected";

    const handle = window.setTimeout(() => {
      if (focusesApprovals) {
        approvalsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (phase === "no_requests") {
        submitSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);

    return () => window.clearTimeout(handle);
  }, [searchParams, listsLoading, activeRunId, approvalWorkflowState.phase]);

  useEffect(() => {
    const pendingRunId = pendingOverviewSubmitScrollRunIdRef.current;

    if (pendingRunId === null || !isReviewContext || activeRunId !== pendingRunId) {
      return;
    }

    if (listsLoading) {
      return;
    }

    pendingOverviewSubmitScrollRunIdRef.current = null;

    const handle = window.setTimeout(() => {
      submitSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    return () => window.clearTimeout(handle);
  }, [isReviewContext, activeRunId, listsLoading]);

  const focusPendingApprovals = useCallback((): void => {
    if (!isReviewContext) {
      return;
    }

    approvalsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isReviewContext]);

  const focusSubmitSection = useCallback((): FocusSubmitSectionResult => {
    const selectedRunId = queryRunId.trim();

    if (selectedRunId.length === 0) {
      return { kind: "blocked-empty-review" };
    }

    if (!isReviewContext) {
      setActiveRunId(selectedRunId);
      setSubmitRunId(selectedRunId);
      replaceApprovalQueueUrl(selectedRunId);
      pendingOverviewSubmitScrollRunIdRef.current = selectedRunId;

      return { kind: "activated-review", runId: selectedRunId };
    }

    window.setTimeout(() => {
      submitSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);

    return { kind: "scrolled-to-submit" };
  }, [isReviewContext, queryRunId, replaceApprovalQueueUrl]);

  const showBuyerApprovalStory =
    buyerPolishedShell &&
    isReviewContext &&
    approvalWorkflowState.canShowCompletionMessaging &&
    approvalWorkflowState.primaryApprovedRequest !== null;
  const workflowOutcomeLine = governanceWorkflowOutcomeLineForPhase(approvalWorkflowState.phase);
  const pageTitle = GOVERNANCE_OVERVIEW_PAGE_TITLE;
  const pageLead = isReviewContext
    ? showBuyerApprovalStory
      ? BUYER_GOVERNANCE_GOVERNED_USE_SCOPE
      : GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD
    : governanceOverviewPageLead(buyerPolishedShell);

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
        <GovernanceOverviewPanelDeferred
          buyerPolishedShell={buyerPolishedShell}
          canMutateWorkflow={canMutateWorkflow}
          queryRunId={queryRunId}
          setQueryRunId={setQueryRunId}
          onLoadReview={onLoadRun}
          onFocusSubmit={focusSubmitSection}
          onFocusPending={focusPendingApprovals}
          listsLoading={listsLoading}
        />
      ) : null}

      {isReviewContext ? (
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
