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
import { governanceWorkflowMutationBlockedReason } from "@/lib/governance/governance-workflow-mutation-blocked-reason";
import {
  GOVERNANCE_WORKFLOW_AUDIT_NAME_REQUIRED_BEFORE_RELEASE,
  GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST,
} from "@/lib/governance/governance-workflow-release-copy";
import type {
  GovernanceApprovalRequest,
  GovernanceEnvironmentActivation,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";

import type { GovernanceWorkflowPendingReview } from "@/app/(operator)/governance/_sections/governance-workflow-helpers";
import type { GovernanceMutationCorrectionTarget } from "@/lib/governance/governance-mutation-correction-api";
import type { GovernanceMutationReversibilityId } from "@/lib/mutation-reversibility-registry";
import { isLivelihoodMutation401RedirectError } from "@/lib/auth/livelihood-mutation-401-resume";
import { submitGovernanceWorkflowTransitionWith401Resume } from "@/lib/auth/livelihood-mutation-401-resume-wrappers";

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
  readonly livelihoodReturnPath: string;
};

export type UseGovernanceWorkflowMutationsResult = {
  readonly mutationSuccessMessage: string | null;
  readonly setMutationSuccessMessage: (message: string | null) => void;
  readonly mutationCorrectionTarget: GovernanceMutationCorrectionTarget | null;
  readonly mutationCorrectionMutationId: GovernanceMutationReversibilityId | null;
  readonly setMutationCorrectionTarget: (value: GovernanceMutationCorrectionTarget | null) => void;
  readonly setMutationCorrectionMutationId: (value: GovernanceMutationReversibilityId | null) => void;
  readonly mutationErrorMessage: string | null;
  readonly mutationErrorIsConcurrencyConflict: boolean;
  readonly mutationBlockedReason: string | null;
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
    livelihoodReturnPath,
  } = options;

  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<string | null>(null);
  const [mutationCorrectionTarget, setMutationCorrectionTarget] =
    useState<GovernanceMutationCorrectionTarget | null>(null);
  const [mutationCorrectionMutationId, setMutationCorrectionMutationId] =
    useState<GovernanceMutationReversibilityId | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [mutationErrorIsConcurrencyConflict, setMutationErrorIsConcurrencyConflict] = useState(false);
  const [mutationBlockedReason, setMutationBlockedReason] = useState<string | null>(null);

  function reportMutationFailure(error: unknown): void {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    setMutationErrorMessage(blockedReason ?? failure.message);
    setMutationErrorIsConcurrencyConflict(failure.httpStatus === 409);
    setMutationBlockedReason(blockedReason);
    setMutationSuccessMessage(null);
  }

  function clearMutationFailure(): void {
    setMutationErrorMessage(null);
    setMutationErrorIsConcurrencyConflict(false);
    setMutationBlockedReason(null);
  }

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
      await submitGovernanceWorkflowTransitionWith401Resume(
        {
          action: "submit_approval",
          body: {
            runId,
            manifestVersion: submitManifestVersion.trim(),
            sourceEnvironment: submitSource,
            targetEnvironment: submitTarget,
            requestComment: submitComment.trim() || undefined,
          },
        },
        { returnPath: livelihoodReturnPath },
      );
      setMutationSuccessMessage(GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS);
      clearMutationFailure();
      setSubmitComment("");
      setSubmitApprovalComplete(true);

      if (activeRunId === runId) {
        await refetchRunLists();
      }
    } catch (e) {
      if (isLivelihoodMutation401RedirectError(e)) {
        return;
      }

      reportMutationFailure(e);
    } finally {
      setSubmitBusy(false);
    }
  }, [
    activeRunId,
    canMutateWorkflow,
    livelihoodReturnPath,
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
      if (pendingReview.mode === "approve") {
        await submitGovernanceWorkflowTransitionWith401Resume(
          {
            action: "approve",
            approvalRequestId: pendingReview.approvalRequestId,
            body: {
              reviewedBy: reviewedBy.trim(),
              reviewComment: reviewComment.trim() || undefined,
            },
          },
          { returnPath: livelihoodReturnPath },
        );
        setMutationSuccessMessage(GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS);
        setMutationCorrectionTarget({
          mutationKind: "governance_workflow_approve",
          subjectId: pendingReview.approvalRequestId,
          runId: pendingReview.runId,
        });
        setMutationCorrectionMutationId("governance_workflow_approve");
        setMutationErrorMessage(null);
        setMutationErrorIsConcurrencyConflict(false);
      } else {
        await submitGovernanceWorkflowTransitionWith401Resume(
          {
            action: "reject",
            approvalRequestId: pendingReview.approvalRequestId,
            body: {
              reviewedBy: reviewedBy.trim(),
              reviewComment: reviewComment.trim() || undefined,
            },
          },
          { returnPath: livelihoodReturnPath },
        );
        setMutationSuccessMessage(GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS);
        setMutationCorrectionTarget({
          mutationKind: "governance_workflow_reject",
          subjectId: pendingReview.approvalRequestId,
          runId: pendingReview.runId,
        });
        setMutationCorrectionMutationId("governance_workflow_reject");
        setMutationErrorMessage(null);
        setMutationErrorIsConcurrencyConflict(false);
      }

      setPendingReview(null);
      setReviewedBy("");
      setReviewComment("");
      await refreshIfActive();
    } catch (e) {
      if (isLivelihoodMutation401RedirectError(e)) {
        return;
      }

      reportMutationFailure(e);
    } finally {
      setReviewBusy(false);
    }
  }, [canMutateWorkflow, livelihoodReturnPath, pendingReview, refreshIfActive, reviewComment, reviewedBy]);

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
      const promotion = await submitGovernanceWorkflowTransitionWith401Resume(
        {
          action: "promote",
          body: {
            runId: promoteFor.runId,
            manifestVersion: promoteFor.manifestVersion,
            sourceEnvironment: promoteFor.sourceEnvironment,
            targetEnvironment: promoteFor.targetEnvironment,
            promotedBy: by,
            approvalRequestId: promoteFor.approvalRequestId ?? undefined,
          },
        },
        { returnPath: livelihoodReturnPath },
      ) as GovernancePromotionRecord;
      setMutationSuccessMessage(GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST);
      setMutationCorrectionTarget({
        mutationKind: "governance_workflow_promote",
        subjectId: promotion.promotionRecordId,
        runId: promoteFor.runId,
      });
      setMutationCorrectionMutationId("governance_workflow_promote");
      setMutationErrorMessage(null);
      setPendingPromote(null);
      pendingPromoteRequestRef.current = null;
      await refreshIfActive();
    } catch (e) {
      if (isLivelihoodMutation401RedirectError(e)) {
        return;
      }

      reportMutationFailure(e);
    } finally {
      setPromoteBusy(false);
    }
  }, [canMutateWorkflow, livelihoodReturnPath, refreshIfActive, workflowActor]);

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
      const activation = await submitGovernanceWorkflowTransitionWith401Resume(
        {
          action: "activate",
          body: {
            runId: row.runId,
            manifestVersion: row.manifestVersion,
            environment: row.targetEnvironment,
            activatedBy: by,
          },
        },
        { returnPath: livelihoodReturnPath },
      ) as GovernanceEnvironmentActivation;
      setMutationSuccessMessage(governanceWorkflowActivateSuccessMessage(row.manifestVersion, row.targetEnvironment));
      setMutationCorrectionTarget({
        mutationKind: "governance_workflow_activate",
        subjectId: activation.activationId,
        runId: row.runId,
      });
      setMutationCorrectionMutationId("governance_workflow_activate");
      setMutationErrorMessage(null);
      setPendingActivate(null);
      pendingActivatePromotionRef.current = null;
      await refreshIfActive();
    } catch (e) {
      if (isLivelihoodMutation401RedirectError(e)) {
        return;
      }

      reportMutationFailure(e);
    } finally {
      setActivateBusyId(null);
    }
  }, [canMutateWorkflow, livelihoodReturnPath, refreshIfActive, workflowActor]);

  return {
    mutationSuccessMessage,
    setMutationSuccessMessage,
    mutationCorrectionTarget,
    mutationCorrectionMutationId,
    setMutationCorrectionTarget,
    setMutationCorrectionMutationId,
    mutationErrorMessage,
    mutationErrorIsConcurrencyConflict,
    mutationBlockedReason,
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
