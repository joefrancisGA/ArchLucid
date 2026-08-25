"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  GOVERNANCE_WORKFLOW_ACTIVATE_AUDIT_NAME_REQUIRED,
  GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS,
  GOVERNANCE_WORKFLOW_REVIEWED_BY_REQUIRED,
  governanceWorkflowActivateSuccessMessage,
} from "@/lib/governance/governance-mutation-outcome-copy";
import {
  GOVERNANCE_WORKFLOW_AUDIT_NAME_REQUIRED_BEFORE_RELEASE,
  GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST,
} from "@/lib/governance/governance-workflow-release-copy";
import type { GovernanceApprovalRequest, GovernancePromotionRecord } from "@/types/governance-workflow";

import type { GovernanceWorkflowPendingReview } from "@/app/(operator)/governance/_sections/governance-workflow-helpers";

type GovernanceWorkflowPromotePending = {
  manifestId: string;
  targetEnv: string;
};

type GovernanceWorkflowActivatePending = {
  activationId: string;
  env: string;
};

export type UseGovernanceWorkflowMutationsOptions = {
  readonly canMutateWorkflow: boolean;
  readonly activeRunId: string | null;
  readonly refetchRunLists: () => Promise<unknown>;
  readonly submitRunId: string;
  readonly submitManifestVersion: string;
  readonly submitSource: string;
  readonly submitTarget: string;
  readonly submitComment: string;
  readonly setSubmitComment: (value: string) => void;
  readonly workflowActor: string;
};

export type UseGovernanceWorkflowMutationsResult = {
  readonly mutationSuccessMessage: string | null;
  readonly setMutationSuccessMessage: (message: string | null) => void;
  readonly mutationErrorMessage: string | null;
  readonly setMutationErrorMessage: (message: string | null) => void;
  readonly submitBusy: boolean;
  readonly submitApprovalComplete: boolean;
  readonly reviewBusy: boolean;
  readonly promoteBusy: boolean;
  readonly activateBusyId: string | null;
  readonly pendingReview: GovernanceWorkflowPendingReview | null;
  readonly setPendingReview: (value: GovernanceWorkflowPendingReview | null) => void;
  readonly reviewedBy: string;
  readonly setReviewedBy: (value: string) => void;
  readonly reviewComment: string;
  readonly setReviewComment: (value: string) => void;
  readonly pendingPromote: GovernanceWorkflowPromotePending | null;
  readonly setPendingPromote: (value: GovernanceWorkflowPromotePending | null) => void;
  readonly pendingPromoteRequestRef: MutableRefObject<GovernanceApprovalRequest | null>;
  readonly pendingActivate: GovernanceWorkflowActivatePending | null;
  readonly setPendingActivate: (value: GovernanceWorkflowActivatePending | null) => void;
  readonly pendingActivatePromotionRef: MutableRefObject<GovernancePromotionRecord | null>;
  readonly onSubmitApproval: () => Promise<void>;
  readonly onConfirmReview: () => Promise<void>;
  readonly onConfirmPromote: () => Promise<void>;
  readonly onConfirmActivateFromPromotion: () => Promise<void>;
  readonly refreshIfActive: () => Promise<void>;
};

export function useGovernanceWorkflowMutations(
  options: UseGovernanceWorkflowMutationsOptions,
): UseGovernanceWorkflowMutationsResult {
  const {
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
  } = options;

  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);

  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitApprovalComplete, setSubmitApprovalComplete] = useState(false);

  const [pendingReview, setPendingReview] = useState<GovernanceWorkflowPendingReview | null>(null);
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const [promoteBusy, setPromoteBusy] = useState(false);

  const [pendingPromote, setPendingPromote] = useState<GovernanceWorkflowPromotePending | null>(null);
  const pendingPromoteRequestRef = useRef<GovernanceApprovalRequest | null>(null);

  const [pendingActivate, setPendingActivate] = useState<GovernanceWorkflowActivatePending | null>(null);
  const pendingActivatePromotionRef = useRef<GovernancePromotionRecord | null>(null);

  const [activateBusyId, setActivateBusyId] = useState<string | null>(null);

  const refreshIfActive = useCallback(async () => {
    if (activeRunId !== null) {
      await refetchRunLists();
    }
  }, [activeRunId, refetchRunLists]);

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

  const onSubmitApproval = useCallback(async () => {
    if (!canMutateWorkflow) {
      return;
    }

    const runId = submitRunId.trim();

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
      setSubmitApprovalComplete(true);

      if (activeRunId === runId) {
        await refetchRunLists();
      }
    } catch (e) {
      const f = toApiLoadFailure(e);
      setMutationErrorMessage(f.message);
      setMutationSuccessMessage(null);
    } finally {
      setSubmitBusy(false);
    }
  }, [
    activeRunId,
    canMutateWorkflow,
    refetchRunLists,
    setSubmitComment,
    submitComment,
    submitManifestVersion,
    submitRunId,
    submitSource,
    submitTarget,
  ]);

  const onConfirmReview = useCallback(async () => {
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
  }, [canMutateWorkflow, pendingReview, refreshIfActive, reviewComment, reviewedBy]);

  const onConfirmPromote = useCallback(async () => {
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
  }, [canMutateWorkflow, refreshIfActive, workflowActor]);

  const onConfirmActivateFromPromotion = useCallback(async () => {
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
  }, [canMutateWorkflow, refreshIfActive, workflowActor]);

  return {
    mutationSuccessMessage,
    setMutationSuccessMessage,
    mutationErrorMessage,
    setMutationErrorMessage,
    submitBusy,
    submitApprovalComplete,
    reviewBusy,
    promoteBusy,
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
    onConfirmPromote,
    onConfirmActivateFromPromotion,
    refreshIfActive,
  };
}
