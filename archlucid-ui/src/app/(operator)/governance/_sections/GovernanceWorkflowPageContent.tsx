"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { MutationErrorBoundary } from "@/components/MutationErrorBoundary";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Separator } from "@/components/ui/separator";
import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { ApprovalLineageQueueVocabularyRail } from "@/components/ApprovalLineageQueueVocabularyRail";
import { PackageGovernanceApprovalQueueVocabularyRail } from "@/components/PackageGovernanceApprovalQueueVocabularyRail";
import { GovernanceJobRouterStrip } from "@/components/GovernanceJobRouterStrip";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayerHeader } from "@/components/LayerHeader";
import {
  listActivations,
  listApprovalRequests,
  listPromotions,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  shouldSeedStaticDemoGovernanceRecordsForRun,
  STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS,
  tryStaticDemoGovernanceApprovalRequests,
  tryStaticDemoGovernancePromotions,
  warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce,
} from "@/lib/operator-static-demo";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import {
  GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER,
  GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION,
  GOVERNANCE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
  GOVERNANCE_OVERVIEW_WORKSPACE_HEALTH_LINK_LABEL,
  governanceOverviewPageLead,
  GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD,
} from "@/lib/governance/governance-overview-copy";
import { governanceApprovalQueueHref, GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import {
  BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD,
  BUYER_GOVERNANCE_GOVERNED_USE_SCOPE,
} from "@/lib/buyer-polish-copy";
import {
  GOVERNANCE_WORKFLOW_ACTIVATE_AUDIT_NAME_REQUIRED,
  GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS,
  GOVERNANCE_WORKFLOW_LOAD_REVIEW_REQUIRED,
  GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS,
  GOVERNANCE_WORKFLOW_REVIEWED_BY_REQUIRED,
  governanceWorkflowActivateSuccessMessage,
} from "@/lib/governance/governance-mutation-outcome-copy";
import {
  GOVERNANCE_WORKFLOW_AUDIT_NAME_REQUIRED_BEFORE_RELEASE,
  GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL,
  GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST,
} from "@/lib/governance/governance-workflow-release-copy";
import type {
  GovernanceApprovalRequest,
  GovernanceEnvironmentActivation,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { deriveGovernanceApprovalWorkflowState } from "./governance-approval-workflow-state";
import {
  AdvancedOptionsAccordionDeferred,
  CtoDemoBuyerValueStripDeferred,
  CtoDemoGovernancePreviewHintDeferred,
  CtoDemoSegregationCalloutDeferred,
  GovernanceApprovalStoryCardDeferred,
  GovernanceInteractiveQuickstartContentDeferred,
  GovernanceOverviewPanelDeferred,
  GovernanceReviewContextBarDeferred,
  GovernanceWorkflowApprovalsListDeferred,
  GovernanceWorkflowDialogsDeferred,
  GovernanceWorkflowPromotionsActivationsSectionDeferred,
  GovernanceWorkflowSubmitSectionDeferred,
} from "./governance-workflow-deferred-chunks";
import {
  sortGovernanceActivations,
  sortGovernancePromotions,
  type GovernanceWorkflowPendingReview,
} from "./governance-workflow-helpers";
import { loadGovernanceReviewContext } from "./load-governance-review-context";
import {
  GOVERNANCE_APPROVAL_DECISION_RECORD_TITLE,
  GOVERNANCE_APPROVAL_REQUESTS_COMPACT_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_LEAD,
  GOVERNANCE_APPROVAL_REQUESTS_SECTION_TITLE,
  governanceWorkflowOutcomeLineForPhase,
} from "@/lib/governance/governance-workflow-section-copy";

export function GovernanceWorkflowPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canMutateWorkflow = useOperateCapability();
  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const submitSectionRef = useRef<HTMLDivElement | null>(null);
  const approvalsSectionRef = useRef<HTMLElement | null>(null);
  const deepLinkFocusHandledRef = useRef<string | null>(null);

  const [submitRunId, setSubmitRunId] = useState("");
  const [submitManifestVersion, setSubmitManifestVersion] = useState("");
  const [submitSource, setSubmitSource] = useState<string>("");
  const [submitTarget, setSubmitTarget] = useState<string>("");
  const [submitComment, setSubmitComment] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);

  const [queryRunId, setQueryRunId] = useState("");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeReviewDisplayTitle, setActiveReviewDisplayTitle] = useState<string | null>(null);
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

  const replaceApprovalQueueUrl = useCallback(
    (runId: string | null): void => {
      router.replace(governanceApprovalQueueHref(runId), { scroll: false });
    },
    [router],
  );

  const clearReviewContext = useCallback((): void => {
    setActiveRunId(null);
    setActiveReviewDisplayTitle(null);
    setApprovals([]);
    setPromotions([]);
    setActivations([]);
    setListFailure(null);
    setShowingStaticDemoGovernanceRecords(false);
    setPendingReview(null);
    replaceApprovalQueueUrl(null);
  }, [replaceApprovalQueueUrl]);

  useEffect(() => {
    warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce();
  }, []);

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
      setMutationErrorMessage(GOVERNANCE_WORKFLOW_LOAD_REVIEW_REQUIRED);
      setMutationSuccessMessage(null);

      return;
    }

    setActiveRunId(id);
    setSubmitRunId(id);
    setMutationErrorMessage(null);
    replaceApprovalQueueUrl(id);
    void loadLists(id);
  }, [queryRunId, loadLists, replaceApprovalQueueUrl]);

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

    // Always adopt the deep-link runId into the submit form — preferAutoPick on the submit
    // section's AskRunIdPicker must not win the race and silently overwrite it afterward.
    setSubmitRunId(fromQuery);
    void loadLists(fromQuery);
  }, [searchParams, loadLists]);

  useEffect(() => {
    if (activeRunId === null) {
      setActiveReviewDisplayTitle(null);

      return;
    }

    let cancelled = false;

    void loadGovernanceReviewContext(activeRunId).then((context) => {
      if (cancelled) {
        return;
      }

      setActiveReviewDisplayTitle(context.displayTitle);
      setSubmitManifestVersion(context.manifestVersion ?? "");
    });

    return () => {
      cancelled = true;
    };
  }, [activeRunId]);

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

  const focusPendingApprovals = useCallback((): void => {
    if (!isReviewContext) {
      return;
    }

    approvalsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isReviewContext]);

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

    // The submit button is already disabled while these fields are incomplete — this guard is
    // a safety net only, so it returns quietly instead of duplicating a validation toast.
    if (!runId || !submitManifestVersion.trim()) {
      return;
    }

    setSubmitBusy(true);

    try {
      const { submitApprovalRequest } = await import("@/lib/api");
      await submitApprovalRequest({
        runId,
        manifestVersion: submitManifestVersion.trim(),
        sourceEnvironment: submitSource,
        targetEnvironment: submitTarget,
        requestComment: submitComment.trim() || undefined,
      });
      setMutationSuccessMessage(GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS);
      setMutationErrorMessage(null);
      setSubmitComment("");

      if (activeRunId === runId) {
        await loadLists(runId);
      }
    } catch (e) {
      const f = toApiLoadFailure(e);
      setMutationErrorMessage(f.message);
      setMutationSuccessMessage(null);
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
      setMutationErrorMessage(GOVERNANCE_WORKFLOW_REVIEWED_BY_REQUIRED);
      setMutationSuccessMessage(null);

      return;
    }

    setReviewBusy(true);

    try {
      const { approveRequest, rejectRequest } = await import("@/lib/api");

      if (pendingReview.mode === "approve") {
        await approveRequest(pendingReview.approvalRequestId, {
          reviewedBy: reviewedBy.trim(),
          reviewComment: reviewComment.trim() || undefined,
        });
        setMutationSuccessMessage(GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS);
        setMutationErrorMessage(null);
      } else {
        await rejectRequest(pendingReview.approvalRequestId, {
          reviewedBy: reviewedBy.trim(),
          reviewComment: reviewComment.trim() || undefined,
        });
        setMutationSuccessMessage(GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS);
        setMutationErrorMessage(null);
      }

      setPendingReview(null);
      setReviewedBy("");
      setReviewComment("");
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setMutationErrorMessage(f.message);
      setMutationSuccessMessage(null);
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
      setMutationErrorMessage(GOVERNANCE_WORKFLOW_AUDIT_NAME_REQUIRED_BEFORE_RELEASE);
      setMutationSuccessMessage(null);

      return;
    }

    setPromoteBusy(true);

    try {
      const { promoteManifest } = await import("@/lib/api");
      await promoteManifest({
        runId: promoteFor.runId,
        manifestVersion: promoteFor.manifestVersion,
        sourceEnvironment: promoteFor.sourceEnvironment,
        targetEnvironment: promoteFor.targetEnvironment,
        promotedBy: by,
        approvalRequestId: promoteFor.approvalRequestId ?? undefined,
      });
      setMutationSuccessMessage(GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST);
      setMutationErrorMessage(null);
      setPendingPromote(null);
      pendingPromoteRequestRef.current = null;
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setMutationErrorMessage(f.message);
      setMutationSuccessMessage(null);
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
      setMutationErrorMessage(GOVERNANCE_WORKFLOW_ACTIVATE_AUDIT_NAME_REQUIRED);
      setMutationSuccessMessage(null);

      return;
    }

    setActivateBusyId(row.promotionRecordId);

    try {
      const { activateEnvironment } = await import("@/lib/api");
      await activateEnvironment({
        runId: row.runId,
        manifestVersion: row.manifestVersion,
        environment: row.targetEnvironment,
        activatedBy: by,
      });
      setMutationSuccessMessage(governanceWorkflowActivateSuccessMessage(row.manifestVersion, row.targetEnvironment));
      setMutationErrorMessage(null);
      setPendingActivate(null);
      pendingActivatePromotionRef.current = null;
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setMutationErrorMessage(f.message);
      setMutationSuccessMessage(null);
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
            <GovernanceInteractiveQuickstartContentDeferred hideFirst30DaysLink={buyerPolishedShell} />
          ) : undefined
        }
      />
      {isReviewContext ? <CtoDemoBuyerValueStripDeferred stepIndex={3} /> : null}
      {isReviewContext ? <CtoDemoSegregationCalloutDeferred /> : null}
      {isReviewContext ? <CtoDemoGovernancePreviewHintDeferred /> : null}
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
              Production deployments and change-managed releases follow your enterprise process—this page does not configure
              releases.
            </span>
          ) : null
        }
        actions={overviewHeaderActions}
      />
      <GovernanceJobRouterStrip currentJobId="approve-governance" />
      <ApprovalLineageQueueVocabularyRail currentSurfaceId="approval-queue" />
      <PackageGovernanceApprovalQueueVocabularyRail currentSurfaceId="approval-queue" />

      {mutationSuccessMessage !== null ? (
        <OperatorSuccessCallout
          message={mutationSuccessMessage}
          testId="governance-workflow-mutation-success"
          className="mb-4"
          onDismiss={() => setMutationSuccessMessage(null)}
        />
      ) : null}

      {mutationErrorMessage !== null ? (
        <OperatorMutationInlineError
          message={mutationErrorMessage}
          testId="governance-workflow-mutation-error"
          className="mb-4"
        />
      ) : null}

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
                "mb-4 rounded-md border border-amber-600/40 bg-amber-50/90 px-3 py-2 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100",
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
            <p className={cn("m-0 mt-2 mb-4 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
        </>
      ) : null}

      <GovernanceWorkflowDialogsDeferred
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
