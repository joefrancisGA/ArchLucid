"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useGovernanceReviewContextQuery } from "@/hooks/use-governance-review-context-query";
import { useGovernanceWorkflowMutations } from "@/hooks/use-governance-workflow-mutations";
import { useGovernanceWorkflowRunListsQuery } from "@/hooks/use-governance-workflow-run-lists-query";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT,
  resolveDefaultGovernanceSubmitManifestVersion,
} from "@/lib/governance/governance-submit-manifest-version";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  governanceApprovalReviewHrefFromSearch,
  parseGovernanceApprovalIdFromSearch,
  parseGovernanceReviewModeFromSearch,
} from "@/lib/governance/governance-approval-review-url";
import {
  governanceApprovalPromoteActivateHrefFromSearch,
  parseGovernanceActivateIdFromSearch,
  parseGovernancePromoteEnvFromSearch,
  parseGovernancePromoteManifestFromSearch,
} from "@/lib/governance/governance-approval-promote-activate-url";
import type { GovernanceWorkflowPendingReview } from "./governance-workflow-helpers";

export function useGovernanceWorkflowPageMutations() {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_APPROVAL_QUEUE_PATH;
  const searchParams = useSearchParams();
  const urlPromoteManifest = parseGovernancePromoteManifestFromSearch(searchParams.get("promoteManifest"));
  const urlPromoteEnv = parseGovernancePromoteEnvFromSearch(searchParams.get("promoteEnv"));
  const urlActivateId = parseGovernanceActivateIdFromSearch(searchParams.get("activateId"));
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

  const setPendingReview = useCallback(
    (value: GovernanceWorkflowPendingReview | null) => {
      mutations.setPendingReview(value);
      router.replace(
        governanceApprovalReviewHrefFromSearch(searchParams.toString(), value, pathname),
        { scroll: false },
      );
    },
    [mutations, pathname, router, searchParams],
  );

  const syncPromoteActivateToUrl = useCallback(
    (
      pendingPromote: { manifestId: string; targetEnv: string } | null,
      pendingActivate: { activationId: string; env: string } | null,
    ) => {
      router.replace(
        governanceApprovalPromoteActivateHrefFromSearch(
          searchParams.toString(),
          {
            promoteManifestId: pendingPromote?.manifestId ?? null,
            promoteTargetEnv: pendingPromote?.targetEnv ?? null,
            activateId: pendingActivate?.activationId ?? null,
          },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingPromote = useCallback(
    (value: { manifestId: string; targetEnv: string } | null) => {
      mutations.setPendingPromote(value);
      syncPromoteActivateToUrl(value, mutations.pendingActivate);
    },
    [mutations, syncPromoteActivateToUrl],
  );

  const setPendingActivate = useCallback(
    (value: { activationId: string; env: string } | null) => {
      mutations.setPendingActivate(value);
      syncPromoteActivateToUrl(mutations.pendingPromote, value);
    },
    [mutations, syncPromoteActivateToUrl],
  );

  useEffect(() => {
    const approvalRequestId = parseGovernanceApprovalIdFromSearch(searchParams.get("approvalId"));
    const mode = parseGovernanceReviewModeFromSearch(searchParams.get("reviewMode"));

    if (approvalRequestId.length === 0 || mode === null) {
      if (mutations.pendingReview !== null) {
        mutations.setPendingReview(null);
      }

      return;
    }

    if (listsLoading) {
      return;
    }

    const row = approvals.find((approval) => approval.approvalRequestId === approvalRequestId);

    if (row === undefined) {
      return;
    }

    if (
      mutations.pendingReview?.approvalRequestId === approvalRequestId
      && mutations.pendingReview.mode === mode
    ) {
      return;
    }

    mutations.setPendingReview({
      approvalRequestId,
      mode,
      runId: row.runId,
    });
  }, [approvals, listsLoading, mutations, searchParams]);

  useEffect(() => {
    if (urlPromoteManifest.length === 0 || urlPromoteEnv.length === 0) {
      if (mutations.pendingPromote !== null) {
        setPendingPromote(null);
      }

      return;
    }

    if (listsLoading) {
      return;
    }

    const row =
      approvals.find(
        (approval) =>
          approval.manifestVersion === urlPromoteManifest && approval.targetEnvironment === urlPromoteEnv,
      ) ?? null;

    if (row === null) {
      return;
    }

    if (
      mutations.pendingPromote?.manifestId === urlPromoteManifest
      && mutations.pendingPromote?.targetEnv === urlPromoteEnv
    ) {
      return;
    }

    mutations.pendingPromoteRequestRef.current = row;
    setPendingPromote({ manifestId: urlPromoteManifest, targetEnv: urlPromoteEnv });
  }, [approvals, listsLoading, mutations, setPendingPromote, urlPromoteEnv, urlPromoteManifest]);

  useEffect(() => {
    if (urlActivateId.length === 0) {
      if (mutations.pendingActivate !== null) {
        setPendingActivate(null);
      }

      return;
    }

    if (listsLoading) {
      return;
    }

    const promotion = promotions.find((row) => row.promotionRecordId === urlActivateId) ?? null;

    if (promotion === null) {
      return;
    }

    if (mutations.pendingActivate?.activationId === urlActivateId) {
      return;
    }

    mutations.pendingActivatePromotionRef.current = promotion;
    setPendingActivate({ activationId: urlActivateId, env: promotion.targetEnvironment });
  }, [listsLoading, mutations, promotions, setPendingActivate, urlActivateId]);

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

  const onConfirmReview = useCallback(async () => {
    const hadReview = mutations.pendingReview !== null;
    await mutations.onConfirmReview();

    if (hadReview) {
      router.replace(
        governanceApprovalReviewHrefFromSearch(searchParams.toString(), null, pathname),
        { scroll: false },
      );
    }
  }, [mutations, pathname, router, searchParams]);

  const onConfirmPromote = useCallback(async () => {
    await mutations.onConfirmPromote();

    if (mutations.pendingPromote === null) {
      syncPromoteActivateToUrl(null, mutations.pendingActivate);
    }
  }, [mutations, syncPromoteActivateToUrl]);

  const onConfirmActivateFromPromotion = useCallback(async () => {
    await mutations.onConfirmActivateFromPromotion();

    if (mutations.pendingActivate === null) {
      syncPromoteActivateToUrl(mutations.pendingPromote, null);
    }
  }, [mutations, syncPromoteActivateToUrl]);

  const mutationsWithUrl = {
    ...mutations,
    setPendingPromote,
    setPendingActivate,
    onConfirmPromote,
    onConfirmActivateFromPromotion,
  };

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
    mutations: mutationsWithUrl,
    submitBusy: mutations.submitBusy,
    submitApprovalComplete: mutations.submitApprovalComplete,
    reviewBusy: mutations.reviewBusy,
    activateBusyId: mutations.activateBusyId,
    pendingReview: mutations.pendingReview,
    setPendingReview,
    reviewedBy: mutations.reviewedBy,
    setReviewedBy: mutations.setReviewedBy,
    reviewComment: mutations.reviewComment,
    setReviewComment: mutations.setReviewComment,
    pendingPromote: mutations.pendingPromote,
    setPendingPromote,
    pendingPromoteRequestRef: mutations.pendingPromoteRequestRef,
    pendingActivate: mutations.pendingActivate,
    setPendingActivate,
    pendingActivatePromotionRef: mutations.pendingActivatePromotionRef,
    onSubmitApproval: mutations.onSubmitApproval,
    onConfirmReview,
    onConfirmPromote,
    onConfirmActivateFromPromotion,
    refreshIfActive: mutations.refreshIfActive,
    setMutationSuccessMessage: mutations.setMutationSuccessMessage,
    setMutationErrorMessage: mutations.setMutationErrorMessage,
  };
}

export type GovernanceWorkflowPageMutationsModel = ReturnType<typeof useGovernanceWorkflowPageMutations>;
