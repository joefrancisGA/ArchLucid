"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { CtoDemoSegregationCallout } from "@/components/cto-demo/CtoDemoSegregationCallout";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { MutationErrorBoundary } from "@/components/MutationErrorBoundary";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Separator } from "@/components/ui/separator";
import { GovernanceInteractiveQuickstartContent } from "@/components/GovernanceInteractiveQuickstartContent";
import { GovernanceApprovalStoryCard } from "@/components/GovernanceApprovalStoryCard";
import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayerHeader } from "@/components/LayerHeader";
import {
  activateEnvironment,
  approveRequest,
  listActivations,
  listApprovalRequests,
  listPromotions,
  promoteManifest,
  rejectRequest,
  submitApprovalRequest,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { CtoDemoGovernancePreviewHint } from "@/components/OperateCapabilityHints";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  shouldSeedStaticDemoGovernanceRecordsForRun,
  STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS,
  tryStaticDemoGovernanceApprovalRequests,
  tryStaticDemoGovernancePromotions,
  warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce,
} from "@/lib/operator-static-demo";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER,
  GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION,
  GOVERNANCE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
  GOVERNANCE_OVERVIEW_WORKSPACE_HEALTH_LINK_LABEL,
  governanceOverviewPageLead,
  GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD,
  GOVERNANCE_REVIEW_CONTEXT_PAGE_TITLE,
} from "@/lib/governance-overview-copy";
import {
  BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD,
  BUYER_GOVERNANCE_GOVERNED_USE_SCOPE,
} from "@/lib/buyer-polish-copy";
import {
  GOVERNANCE_WORKFLOW_AUDIT_NAME_REQUIRED_BEFORE_RELEASE,
  GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL,
  GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST,
} from "@/lib/governance-workflow-release-copy";
import type {
  GovernanceApprovalRequest,
  GovernanceEnvironmentActivation,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { GovernanceOverviewPanel } from "./GovernanceOverviewPanel";
import { deriveGovernanceApprovalWorkflowState } from "./governance-approval-workflow-state";
import { GovernanceReviewContextBar } from "./GovernanceReviewContextBar";
import { GovernanceWorkflowApprovalsList } from "./GovernanceWorkflowApprovalsList";
import { GovernanceWorkflowDialogs } from "./GovernanceWorkflowDialogs";
import { GovernanceWorkflowPromotionsActivationsSection } from "./GovernanceWorkflowPromotionsActivationsSection";
import { GovernanceWorkflowSubmitSection } from "./GovernanceWorkflowSubmitSection";
import {
  sortGovernanceActivations,
  sortGovernancePromotions,
  type GovernanceWorkflowPendingReview,
  type GovernanceWorkflowToastState,
} from "./governance-workflow-helpers";
import {
  GOVERNANCE_APPROVAL_DECISION_RECORD_TITLE,
  GOVERNANCE_APPROVAL_REQUESTS_COMPACT_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_TITLE,
  governanceWorkflowOutcomeLineForPhase,
} from "@/lib/governance-workflow-section-copy";

export function GovernanceWorkflowPageContent() {
  const searchParams = useSearchParams();
  const canMutateWorkflow = useOperateCapability();
  const [toast, setToast] = useState<GovernanceWorkflowToastState>(null);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const submitSectionRef = useRef<HTMLDivElement | null>(null);

  const [submitRunId, setSubmitRunId] = useState("");
  const [submitManifestVersion, setSubmitManifestVersion] = useState("");
  const [submitSource, setSubmitSource] = useState<string>("");
  const [submitTarget, setSubmitTarget] = useState<string>("");
  const [submitComment, setSubmitComment] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);

  const [queryRunId, setQueryRunId] = useState("");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [workflowActor, setWorkflowActor] = useState("");

  const [approvals, setApprovals] = useState<GovernanceApprovalRequest[]>([]);
  const [promotions, setPromotions] = useState<GovernancePromotionRecord[]>([]);
  const [activations, setActivations] = useState<GovernanceEnvironmentActivation[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(null);
  const [showingStaticDemoGovernanceRecords, setShowingStaticDemoGovernanceRecords] = useState(false);

  const isReviewContext = activeRunId !== null;
  const isShowcaseSampleContext =
    isReviewContext &&
    canonicalizeDemoRunId(activeRunId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
  const approvalWorkflowState = deriveGovernanceApprovalWorkflowState({
    activeRunId,
    approvals,
    listsLoading,
  });

  const buyerSuppressGovernanceSubmitChrome =
    buyerPolishedShell && isReviewContext && approvalWorkflowState.canShowCompletionMessaging;

  const listsLoadingShowsBusyChrome = listsLoading && !(buyerPolishedShell && approvals.length > 0);

  const [pendingReview, setPendingReview] = useState<GovernanceWorkflowPendingReview | null>(null);
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const [promoteBusy, setPromoteBusy] = useState(false);

  const [pendingPromote, setPendingPromote] = useState<{
    manifestId: string;
    targetEnv: string;
  } | null>(null);
  const pendingPromoteRequestRef = useRef<GovernanceApprovalRequest | null>(null);

  const [pendingActivate, setPendingActivate] = useState<{
    activationId: string;
    env: string;
  } | null>(null);
  const pendingActivatePromotionRef = useRef<GovernancePromotionRecord | null>(null);

  const [activateBusyId, setActivateBusyId] = useState<string | null>(null);

  const clearReviewContext = useCallback((): void => {
    setActiveRunId(null);
    setApprovals([]);
    setPromotions([]);
    setActivations([]);
    setListFailure(null);
    setShowingStaticDemoGovernanceRecords(false);
    setPendingReview(null);
  }, []);

  useEffect(() => {
    warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce();
  }, []);

  useEffect(() => {
    if (toast === null) {
      return;
    }

    const handle = window.setTimeout(() => setToast(null), 5000);

    return () => window.clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (canMutateWorkflow) {
      return;
    }

    setPendingReview(null);
    setPendingPromote(null);
    pendingPromoteRequestRef.current = null;
    setPendingActivate(null);
    pendingActivatePromotionRef.current = null;
  }, [canMutateWorkflow]);

  const loadLists = useCallback(async (runId: string) => {
    setListsLoading(true);
    setListFailure(null);

    const governanceSeedAllowed = shouldSeedStaticDemoGovernanceRecordsForRun(runId);
    const optimisticApprovals = governanceSeedAllowed ? tryStaticDemoGovernanceApprovalRequests(runId) : null;
    const optimisticPromotions = governanceSeedAllowed ? tryStaticDemoGovernancePromotions(runId) : null;

    if (optimisticApprovals !== null) {
      setApprovals(optimisticApprovals);
      setShowingStaticDemoGovernanceRecords(true);
    } else {
      setApprovals([]);
      setShowingStaticDemoGovernanceRecords(false);
    }

    if (optimisticPromotions !== null) {
      setPromotions(sortGovernancePromotions(optimisticPromotions));
    } else {
      setPromotions([]);
    }

    setActivations([]);

    try {
      const [a, p, act] = await Promise.all([
        listApprovalRequests(runId),
        listPromotions(runId),
        listActivations(runId),
      ]);
      let nextApprovals = a;
      let nextPromotions = p;

      if (nextApprovals.length === 0 && governanceSeedAllowed) {
        const seeded = tryStaticDemoGovernanceApprovalRequests(runId);

        if (seeded !== null) {
          nextApprovals = seeded;
        }
      }

      if (nextPromotions.length === 0 && governanceSeedAllowed) {
        const seededP = tryStaticDemoGovernancePromotions(runId);

        if (seededP !== null) {
          nextPromotions = seededP;
        }
      }

      setApprovals(nextApprovals);
      setPromotions(sortGovernancePromotions(nextPromotions));
      setActivations(sortGovernanceActivations(act));
      setShowingStaticDemoGovernanceRecords(governanceSeedAllowed && a.length === 0 && nextApprovals.length > 0);
    } catch (e) {
      const fail = toApiLoadFailure(e);
      setApprovals([]);
      setPromotions([]);
      setActivations([]);
      setShowingStaticDemoGovernanceRecords(false);

      const idForDemo = runId.trim();

      if (idForDemo.length > 0 && governanceSeedAllowed) {
        const seeded = tryStaticDemoGovernanceApprovalRequests(idForDemo);
        const seededP = tryStaticDemoGovernancePromotions(idForDemo);

        if (seeded !== null) {
          setApprovals(seeded);
          setShowingStaticDemoGovernanceRecords(true);
        }

        if (seededP !== null) {
          setPromotions(sortGovernancePromotions(seededP));
        }

        if (seeded !== null || seededP !== null) {
          setListFailure(null);
          setListsLoading(false);

          return;
        }
      }

      setListFailure(fail);
    } finally {
      setListsLoading(false);
    }
  }, []);

  const onLoadRun = useCallback(() => {
    const id = queryRunId.trim();

    if (!id) {
      setToast({ kind: "err", message: "Choose a review to load approval data." });

      return;
    }

    setActiveRunId(id);
    setSubmitRunId((prev) => (prev.trim().length === 0 ? id : prev));
    void loadLists(id);
  }, [queryRunId, loadLists]);

  const refreshIfActive = useCallback(async () => {
    if (activeRunId !== null) {
      await loadLists(activeRunId);
    }
  }, [activeRunId, loadLists]);

  useEffect(() => {
    const fromQuery = searchParams.get("runId")?.trim() ?? "";

    if (fromQuery.length === 0) {
      return;
    }

    setQueryRunId(fromQuery);
    setActiveRunId(fromQuery);
    setSubmitRunId((prev) => (prev.trim().length === 0 ? fromQuery : prev));
    void loadLists(fromQuery);
  }, [searchParams, loadLists]);

  const focusSubmitSection = useCallback((): void => {
    const selectedRunId = queryRunId.trim();

    if (!isReviewContext && selectedRunId.length > 0) {
      setActiveRunId(selectedRunId);
      setSubmitRunId(selectedRunId);
      void loadLists(selectedRunId);
    }

    window.setTimeout(() => {
      submitSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [isReviewContext, queryRunId, loadLists]);

  async function onSubmitApproval() {
    if (!canMutateWorkflow) {
      return;
    }

    const runId = submitRunId.trim();

    if (!runId || !submitManifestVersion.trim()) {
      setToast({ kind: "err", message: "Choose a review and enter a review record version." });

      return;
    }

    setSubmitBusy(true);

    try {
      await submitApprovalRequest({
        runId,
        manifestVersion: submitManifestVersion.trim(),
        sourceEnvironment: submitSource,
        targetEnvironment: submitTarget,
        requestComment: submitComment.trim() || undefined,
      });
      setToast({ kind: "ok", message: "Approval request submitted." });
      setSubmitComment("");

      if (activeRunId === runId) {
        await loadLists(runId);
      }
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setSubmitBusy(false);
    }
  }

  async function onConfirmReview() {
    if (pendingReview === null) {
      return;
    }

    if (!canMutateWorkflow) {
      return;
    }

    if (!reviewedBy.trim()) {
      setToast({ kind: "err", message: "Reviewed by is required." });

      return;
    }

    setReviewBusy(true);

    try {
      if (pendingReview.mode === "approve") {
        await approveRequest(pendingReview.approvalRequestId, {
          reviewedBy: reviewedBy.trim(),
          reviewComment: reviewComment.trim() || undefined,
        });
        setToast({ kind: "ok", message: "Request approved." });
      } else {
        await rejectRequest(pendingReview.approvalRequestId, {
          reviewedBy: reviewedBy.trim(),
          reviewComment: reviewComment.trim() || undefined,
        });
        setToast({ kind: "ok", message: "Request rejected." });
      }

      setPendingReview(null);
      setReviewedBy("");
      setReviewComment("");
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setReviewBusy(false);
    }
  }

  async function onConfirmPromote() {
    const promoteFor = pendingPromoteRequestRef.current;

    if (promoteFor === null) {
      return;
    }

    if (!canMutateWorkflow) {
      return;
    }

    const by = workflowActor.trim();

    if (!by) {
      setToast({ kind: "err", message: GOVERNANCE_WORKFLOW_AUDIT_NAME_REQUIRED_BEFORE_RELEASE });

      return;
    }

    setPromoteBusy(true);

    try {
      await promoteManifest({
        runId: promoteFor.runId,
        manifestVersion: promoteFor.manifestVersion,
        sourceEnvironment: promoteFor.sourceEnvironment,
        targetEnvironment: promoteFor.targetEnvironment,
        promotedBy: by,
        approvalRequestId: promoteFor.approvalRequestId ?? undefined,
      });
      setToast({ kind: "ok", message: GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST });
      setPendingPromote(null);
      pendingPromoteRequestRef.current = null;
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setPromoteBusy(false);
    }
  }

  async function onConfirmActivateFromPromotion() {
    const row = pendingActivatePromotionRef.current;

    if (row === null) {
      return;
    }

    if (!canMutateWorkflow) {
      return;
    }

    const by = workflowActor.trim();

    if (!by) {
      setToast({ kind: "err", message: "Enter your name for the audit trail before activating." });

      return;
    }

    setActivateBusyId(row.promotionRecordId);

    try {
      await activateEnvironment({
        runId: row.runId,
        manifestVersion: row.manifestVersion,
        environment: row.targetEnvironment,
        activatedBy: by,
      });
      setToast({ kind: "ok", message: `Activated ${row.manifestVersion} for ${row.targetEnvironment}.` });
      setPendingActivate(null);
      pendingActivatePromotionRef.current = null;
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setActivateBusyId(null);
    }
  }

  const showBuyerApprovalStory =
    buyerPolishedShell &&
    isReviewContext &&
    approvalWorkflowState.canShowCompletionMessaging &&
    approvalWorkflowState.primaryApprovedRequest !== null;
  const workflowOutcomeLine = governanceWorkflowOutcomeLineForPhase(approvalWorkflowState.phase);
  const pageTitle = isReviewContext ? GOVERNANCE_REVIEW_CONTEXT_PAGE_TITLE : GOVERNANCE_OVERVIEW_PAGE_TITLE;
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
          href="/governance/dashboard"
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
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
    <div className="w-full max-w-[1200px]">
      <LayerHeader
        pageKey="governance-workflow"
        density="compact"
        collapsibleGuidance={GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER}
        collapsibleChildren={
          !isReviewContext ? (
            <GovernanceInteractiveQuickstartContent hideFirst30DaysLink={buyerPolishedShell} />
          ) : undefined
        }
      />
      {isReviewContext ? <CtoDemoBuyerValueStrip stepIndex={3} /> : null}
      {isReviewContext ? <CtoDemoSegregationCallout /> : null}
      {isReviewContext ? <CtoDemoGovernancePreviewHint /> : null}
      <OperatorPageHeader
        navHref="/governance"
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
              Production deployments and change-managed releases follow your enterprise process—this page does not configure
              releases.
            </span>
          ) : null
        }
        actions={overviewHeaderActions}
      />

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm" role="status">
          <div
            className={cn(
              OPERATOR_TYPOGRAPHY.body,
              "shadow-lg",
              toast.kind === "ok" ? DESIGN_TOKENS.callout.success : DESIGN_TOKENS.callout.blocked,
            )}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      {!isReviewContext ? (
        <GovernanceOverviewPanel
          buyerPolishedShell={buyerPolishedShell}
          canMutateWorkflow={canMutateWorkflow}
          queryRunId={queryRunId}
          setQueryRunId={setQueryRunId}
          onLoadReview={onLoadRun}
          onFocusSubmit={focusSubmitSection}
          onFocusPending={() => undefined}
          listsLoading={listsLoading}
        />
      ) : null}

      {isReviewContext ? (
        <>
          {isShowcaseSampleContext ? (
            <p
              className={cn(
                "mb-4 rounded-md border border-amber-600/40 bg-amber-50/90 px-3 py-2 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="governance-sample-context-banner"
            >
              <strong>{GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL}.</strong> {GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE}
            </p>
          ) : null}

          <GovernanceReviewContextBar
            activeRunId={activeRunId}
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
              <GovernanceApprovalStoryCard
                row={approvalWorkflowState.primaryApprovedRequest!}
                auditTrailHref={`/audit?runId=${encodeURIComponent(activeRunId)}`}
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
            <GovernanceWorkflowSubmitSection
              buyerPolishedShell={buyerPolishedShell}
              buyerSuppressGovernanceSubmitChrome={buyerSuppressGovernanceSubmitChrome}
              canMutateWorkflow={canMutateWorkflow}
              hideGovernanceQueryLoadCard
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
              onSubmitApproval={onSubmitApproval}
            />
          </div>

          <Separator className="mb-10" />

          <section className="mb-10" data-testid="governance-approval-requests-section">
            {showingStaticDemoGovernanceRecords ? (
              <p
                role="status"
                data-testid="governance-static-demo-fallback-status"
                className={cn(
                  "mb-4 rounded-md border border-amber-600/40 bg-amber-50/90 px-3 py-2 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS}
              </p>
            ) : null}
            <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {GOVERNANCE_APPROVAL_REQUESTS_SECTION_TITLE}
            </h3>
            <p className={cn("m-0 mt-2 mb-4 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {showBuyerApprovalStory
                ? GOVERNANCE_APPROVAL_REQUESTS_COMPACT_SECTION_LEAD
                : GOVERNANCE_APPROVAL_REQUESTS_SECTION_LEAD}
            </p>
            <GovernanceWorkflowApprovalsList
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
                <AdvancedOptionsAccordion triggerLabel={GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL} className="mb-10">
                  <GovernanceWorkflowPromotionsActivationsSection
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
                </AdvancedOptionsAccordion>
              </div>
            </>
          )}
          </div>
        </>
      ) : null}

      <AdvancedOptionsAccordion triggerLabel={GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER} defaultOpen={false} className="mb-6">
        <GovernanceInteractiveQuickstartCard hideFirst30DaysLink suppressCardTitle className="mb-0" />
      </AdvancedOptionsAccordion>

      <GovernanceWorkflowDialogs
        pendingPromote={pendingPromote}
        setPendingPromote={setPendingPromote}
        pendingPromoteRequestRef={pendingPromoteRequestRef}
        promoteBusy={promoteBusy}
        onConfirmPromote={onConfirmPromote}
        pendingActivate={pendingActivate}
        setPendingActivate={setPendingActivate}
        pendingActivatePromotionRef={pendingActivatePromotionRef}
        activateBusyId={activateBusyId}
        onConfirmActivateFromPromotion={onConfirmActivateFromPromotion}
      />
    </div>
    </TooltipProvider>
    </MutationErrorBoundary>
  );
}
