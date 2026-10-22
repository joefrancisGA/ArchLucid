"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  isStaticDemoPayloadFallbackEnabled,
  warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce,
} from "@/lib/operator/operator-static-demo";
import {
  GOVERNANCE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD,
  governanceOverviewPageLead,
} from "@/lib/governance/governance-overview-copy";
import { governanceApprovalQueueHref } from "@/lib/governance/governance-route-paths";
import {
  BUYER_GOVERNANCE_GOVERNED_USE_SCOPE,
} from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_WORKFLOW_LOAD_REVIEW_REQUIRED } from "@/lib/governance/governance-mutation-outcome-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { governanceWorkflowOutcomeLineForPhase } from "@/lib/governance/governance-workflow-section-copy";

import { deriveGovernanceApprovalWorkflowState } from "./governance-approval-workflow-state";
import type { FocusSubmitSectionResult } from "./governance-focus-submit-result";
import type { GovernanceWorkflowPageMutationsModel } from "./use-governance-workflow-page-mutations";

export function useGovernanceWorkflowPageTabs(mutations: GovernanceWorkflowPageMutationsModel) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceRun = useWorkspaceActiveRun();
  const submitSectionRef = useRef<HTMLDivElement | null>(null);
  const approvalsSectionRef = useRef<HTMLElement | null>(null);
  const deepLinkFocusHandledRef = useRef<string | null>(null);
  const pendingOverviewSubmitScrollRunIdRef = useRef<string | null>(null);

  const {
    activeRunId,
    approvals,
    buyerPolishedShell,
    listsLoading,
    queryRunId,
    setActiveRunId,
    setMutationErrorMessage,
    setMutationSuccessMessage,
    setPendingReview,
    setQueryRunId,
    setSubmitRunId,
  } = mutations;

  const isReviewContext = activeRunId !== null;
  const urlScopedRunId = searchParams.get("runId")?.trim() ?? "";
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

  const listsLoadingShowsBusyChrome =
    listsLoading && !(buyerPolishedShell && approvals.length > 0);

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
  }, [replaceApprovalQueueUrl, setActiveRunId, setPendingReview]);

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
  }, [
    queryRunId,
    replaceApprovalQueueUrl,
    setActiveRunId,
    setMutationErrorMessage,
    setMutationSuccessMessage,
    setSubmitRunId,
  ]);

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
  }, [searchParams, setActiveRunId, setQueryRunId, setSubmitRunId]);

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
  }, [isReviewContext, queryRunId, replaceApprovalQueueUrl, setActiveRunId, setSubmitRunId]);

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

  return {
    workspaceRun,
    submitSectionRef,
    approvalsSectionRef,
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
  };
}
