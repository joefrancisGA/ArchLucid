"use client";

import { useEffect, useRef, useState } from "react";

import { useGovernanceReviewContextQuery } from "@/hooks/use-governance-review-context-query";
import { useGovernanceWorkflowMutations } from "@/hooks/use-governance-workflow-mutations";
import { useGovernanceWorkflowRunListsQuery } from "@/hooks/use-governance-workflow-run-lists-query";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT,
  resolveDefaultGovernanceSubmitManifestVersion,
} from "@/lib/governance/governance-submit-manifest-version";

export function useGovernanceWorkflowPageMutations() {
  const canMutateWorkflow = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const versionSeedRunIdRef = useRef<string | null>(null);
  const seededDefaultRef = useRef<string>(GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT);

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
  const submitRunIdTrimmed = submitRunId.trim();
  const submitUsesActiveReviewContext =
    submitRunIdTrimmed.length > 0 && submitRunIdTrimmed === activeRunId;
  const submitReviewContextRunId =
    submitRunIdTrimmed.length > 0 && !submitUsesActiveReviewContext
      ? submitRunIdTrimmed
      : null;
  const submitReviewContextQueryResult = useGovernanceReviewContextQuery(
    submitReviewContextRunId,
  );
  const submitReviewContextQuery = submitUsesActiveReviewContext
    ? reviewContextQuery
    : submitReviewContextQueryResult;
  const maxPersistedManifestVersion = submitReviewContextQuery.data?.manifestVersion?.trim() || null;

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

  useEffect(() => {
    const runId = submitRunIdTrimmed;

    if (runId.length === 0) {
      versionSeedRunIdRef.current = null;
      seededDefaultRef.current = GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT;
      setSubmitManifestVersion("");

      return;
    }

    const nextDefault = resolveDefaultGovernanceSubmitManifestVersion(maxPersistedManifestVersion);

    if (versionSeedRunIdRef.current !== runId) {
      versionSeedRunIdRef.current = runId;
      seededDefaultRef.current = nextDefault;
      setSubmitManifestVersion(nextDefault);

      return;
    }

    setSubmitManifestVersion((current) => {
      if (current.trim().length === 0 || current === seededDefaultRef.current) {
        seededDefaultRef.current = nextDefault;

        return nextDefault;
      }

      return current;
    });
  }, [submitRunIdTrimmed, maxPersistedManifestVersion]);

  return {
    canMutateWorkflow,
    buyerPolishedShell,
    submitRunId,
    setSubmitRunId,
    submitManifestVersion,
    setSubmitManifestVersion,
    maxPersistedManifestVersion,
    submitSource,
    setSubmitSource,
    submitTarget,
    setSubmitTarget,
    submitComment,
    setSubmitComment,
    queryRunId,
    setQueryRunId,
    activeRunId,
    setActiveRunId,
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
    submitBusy: mutations.submitBusy,
    submitApprovalComplete: mutations.submitApprovalComplete,
    reviewBusy: mutations.reviewBusy,
    activateBusyId: mutations.activateBusyId,
    pendingReview: mutations.pendingReview,
    setPendingReview: mutations.setPendingReview,
    reviewedBy: mutations.reviewedBy,
    setReviewedBy: mutations.setReviewedBy,
    reviewComment: mutations.reviewComment,
    setReviewComment: mutations.setReviewComment,
    pendingPromote: mutations.pendingPromote,
    setPendingPromote: mutations.setPendingPromote,
    pendingPromoteRequestRef: mutations.pendingPromoteRequestRef,
    pendingActivate: mutations.pendingActivate,
    setPendingActivate: mutations.setPendingActivate,
    pendingActivatePromotionRef: mutations.pendingActivatePromotionRef,
    onSubmitApproval: mutations.onSubmitApproval,
    onConfirmReview: mutations.onConfirmReview,
    refreshIfActive: mutations.refreshIfActive,
    setMutationSuccessMessage: mutations.setMutationSuccessMessage,
    setMutationErrorMessage: mutations.setMutationErrorMessage,
  };
}

export type GovernanceWorkflowPageMutationsModel = ReturnType<typeof useGovernanceWorkflowPageMutations>;
