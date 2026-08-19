"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createRiskException,
  defaultRiskExceptionExpiresAtUtc,
  listFindingDispositions,
  listRiskExceptions,
  recordFindingDisposition,
  revokeRiskException,
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { upsertFindingRemediationAssignment } from "@/lib/api/finding-remediation-assignment-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { validateRemediationOwnerInput } from "@/lib/findings/finding-governance-action-copy";
import { buildSponsorStoryDispositionCountsFromRows } from "@/lib/sponsor-story-synopsis";
import { resolveDispositionConcurrentUpdateNotice } from "@/lib/findings/finding-disposition-concurrent-update";
import { collabRecentActorsFromDispositionHistory } from "@/lib/collab-recent-actor-presence";
import {
  canConfirmFindingApplyChange,
  FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE,
  isFindingApplyChangeDisposition,
} from "@/lib/findings/finding-apply-change-preview-gate";
import {
  APPROVED_DECISION_OVERRIDE_MESSAGE,
  dispositionRequiresRationale,
  dispositionRequiresTradeOffAcknowledgment,
  DISPOSITION_RATIONALE_REQUIRED_MESSAGE,
  isDispositionRationaleSatisfied,
  isRecommendationActionable,
  isTradeOffAcknowledgmentSatisfied,
  proposedChangeOverridesApprovedDecision,
  RECOMMENDATION_ACTIONABILITY_REQUIRED_MESSAGE,
  TRADE_OFF_ACKNOWLEDGMENT_REQUIRED_MESSAGE,
} from "@/lib/review-quality/finding-governance-gates";

type GovernanceBusyAction =
  | "remediation"
  | "disposition"
  | "mark-remediated"
  | "waiver"
  | "revoke-waiver"
  | null;

type PendingDispositionConfirm = "disposition" | "mark-remediated";

export type FindingInspectGovernanceStickinessPanelProps = {
  readonly findingId: string;
  readonly runId: string;
  readonly packageTitle?: string | null;
  readonly initialAssignedToUserId?: string | null;
  readonly initialRemediationDueUtc?: string | null;
  readonly recommendation?: string | null;
  readonly recommendedActions?: readonly string[];
  readonly approvedDecisionTitles?: readonly string[];
};

function latestDispositionLabel(history: readonly FindingDispositionEvent[]): string {
  if (history.length === 0) {
    return "No disposition recorded";
  }

  return history[0]?.disposition ?? "No disposition recorded";
}

export function useFindingInspectGovernanceStickiness(
  props: FindingInspectGovernanceStickinessPanelProps,
) {
  const {
    findingId,
    runId,
    packageTitle = null,
    initialAssignedToUserId = null,
    initialRemediationDueUtc = null,
    recommendation = null,
    recommendedActions = [],
    approvedDecisionTitles = [],
  } = props;
  const canMutate = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [history, setHistory] = useState<FindingDispositionEvent[]>([]);
  const [activeWaiver, setActiveWaiver] = useState<RiskExceptionRecord | null>(null);
  const [assignedToUserId, setAssignedToUserId] = useState(initialAssignedToUserId ?? "");
  const [remediationDueUtc, setRemediationDueUtc] = useState(
    initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "",
  );
  const [disposition, setDisposition] = useState<FindingDispositionKind>("Accepted");
  const [rationale, setRationale] = useState("");
  const [revisitDueUtc, setRevisitDueUtc] = useState("");
  const [evidenceRequestText, setEvidenceRequestText] = useState("");
  const [waiverRationale, setWaiverRationale] = useState("");
  const [waiverOwnerUserId, setWaiverOwnerUserId] = useState("");
  const [waiverExpiresAtUtc, setWaiverExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [waiverEvidenceRef, setWaiverEvidenceRef] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remediationOwnerError, setRemediationOwnerError] = useState<string | null>(null);
  const [waiverOwnerError, setWaiverOwnerError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<GovernanceBusyAction>(null);
  const [pendingDispositionConfirm, setPendingDispositionConfirm] = useState<PendingDispositionConfirm | null>(
    null,
  );
  const [pendingRevokeWaiverConfirm, setPendingRevokeWaiverConfirm] = useState(false);
  const [applyChangePreviewOverride, setApplyChangePreviewOverride] = useState(false);
  const [tradeOffAcknowledgment, setTradeOffAcknowledgment] = useState("");
  const [showIncrementalRereviewLink, setShowIncrementalRereviewLink] = useState(false);

  const reload = useCallback(async (): Promise<FindingDispositionEvent[]> => {
    const [dispositions, waivers] = await Promise.all([
      listFindingDispositions(findingId),
      listRiskExceptions(),
    ]);

    setHistory(dispositions);
    setActiveWaiver(
      waivers.find((w) => w.findingId === findingId && w.status === "Active") ?? null,
    );

    return dispositions;
  }, [findingId]);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        await reload();
      } catch {
        if (!canceled) {
          setErrorMessage(
            buyerPolishedShell
              ? BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE
              : "Governance workflow data unavailable for this finding.",
          );
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [buyerPolishedShell, reload]);

  useEffect(() => {
    setAssignedToUserId(initialAssignedToUserId ?? "");
    setRemediationDueUtc(initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "");
  }, [findingId, initialAssignedToUserId, initialRemediationDueUtc]);

  function resolveMutationError(error: unknown): string {
    const failure = toApiLoadFailure(error);

    if (buyerPolishedShell) {
      return "This governance action could not be saved right now. Your entries are preserved — try again in a moment.";
    }

    return failure.message;
  }

  async function submitRemediationAssignment(): Promise<void> {
    if (!canMutate || busyAction !== null) {
      return;
    }

    const ownerError = validateRemediationOwnerInput(assignedToUserId);
    setRemediationOwnerError(ownerError);

    if (ownerError !== null) {
      return;
    }

    setBusyAction("remediation");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await upsertFindingRemediationAssignment(findingId, {
        runId,
        assignedToUserId: assignedToUserId.trim().length > 0 ? assignedToUserId.trim() : null,
        remediationDueUtc:
          remediationDueUtc.trim().length > 0 ? new Date(remediationDueUtc).toISOString() : null,
      });
      setStatusMessage("Remediation assignment saved.");
    } catch (error) {
      setErrorMessage(resolveMutationError(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function submitDisposition(): Promise<void> {
    if (!canMutate || busyAction !== null) {
      return;
    }

    setBusyAction("disposition");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const saved = await recordFindingDisposition(findingId, {
        disposition,
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
        tradeOffAcknowledgment:
          disposition === "Accepted" && tradeOffAcknowledgment.trim().length > 0
            ? tradeOffAcknowledgment.trim()
            : undefined,
        revisitDueUtc: disposition === "Deferred" && revisitDueUtc.trim().length > 0 ? revisitDueUtc : undefined,
        evidenceRequestText:
          disposition === "NeedsEvidence" && evidenceRequestText.trim().length > 0
            ? evidenceRequestText.trim()
            : undefined,
      });

      const refreshed = await reload();
      const concurrentNotice = resolveDispositionConcurrentUpdateNotice(saved, refreshed);

      setStatusMessage(concurrentNotice ?? "Disposition recorded.");
    } catch (error: unknown) {
      setErrorMessage(resolveMutationError(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function submitExplicitRemediation(): Promise<void> {
    if (!canMutate || busyAction !== null) {
      return;
    }

    setBusyAction("mark-remediated");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const saved = await recordFindingDisposition(findingId, {
        disposition: "Remediated",
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
      });

      const refreshed = await reload();
      const concurrentNotice = resolveDispositionConcurrentUpdateNotice(saved, refreshed);

      setStatusMessage(concurrentNotice ?? "Finding marked as remediated.");
      setShowIncrementalRereviewLink(true);
    } catch (error: unknown) {
      setErrorMessage(resolveMutationError(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function submitWaiver(): Promise<void> {
    if (!canMutate || busyAction !== null) {
      return;
    }

    const ownerError = validateRemediationOwnerInput(waiverOwnerUserId);
    setWaiverOwnerError(ownerError);

    if (ownerError !== null || waiverEvidenceRef.trim().length === 0) {
      if (waiverEvidenceRef.trim().length === 0) {
        setErrorMessage("Evidence reference is required to create a waiver.");
      }

      return;
    }

    setBusyAction("waiver");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await createRiskException({
        findingId,
        runId,
        ownerUserId: waiverOwnerUserId.trim(),
        rationale: waiverRationale.trim(),
        evidenceRef: waiverEvidenceRef.trim(),
        expiresAtUtc: waiverExpiresAtUtc,
      });

      setStatusMessage("Risk exception created.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(resolveMutationError(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function revokeWaiver(): Promise<void> {
    if (activeWaiver === null || !canMutate || busyAction !== null) {
      return;
    }

    setBusyAction("revoke-waiver");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await revokeRiskException(activeWaiver.riskExceptionId);
      setStatusMessage("Waiver revoked.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(resolveMutationError(error));
    } finally {
      setBusyAction(null);
    }
  }

  const currentDisposition = latestDispositionLabel(history);
  const mutationDisabledHintId = "finding-governance-stickiness-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const pendingDispositionKind: FindingDispositionKind =
    pendingDispositionConfirm === "mark-remediated" ? "Remediated" : disposition;
  const sponsorSynopsisCounts = useMemo(
    () =>
      buildSponsorStoryDispositionCountsFromRows([
        { latestDisposition: history[0]?.disposition ?? null },
      ]),
    [history],
  );
  const sponsorSynopsisPackageTitle =
    packageTitle !== null && packageTitle.trim().length > 0 ? packageTitle.trim() : runId;
  const recentDispositionActors = useMemo(
    () => collabRecentActorsFromDispositionHistory(history, { take: 3 }),
    [history],
  );
  const proposedChangeText = (recommendation ?? "").trim();
  const approvedDecisionOverride = useMemo(
    () => proposedChangeOverridesApprovedDecision(proposedChangeText, approvedDecisionTitles),
    [approvedDecisionTitles, proposedChangeText],
  );
  const recommendationIsActionable = useMemo(
    () => isRecommendationActionable(proposedChangeText, recommendedActions),
    [proposedChangeText, recommendedActions],
  );

  function dispositionConfirmBlockedReason(kind: FindingDispositionKind): string | null {
    if (dispositionRequiresRationale(kind) && !isDispositionRationaleSatisfied(rationale)) {
      return DISPOSITION_RATIONALE_REQUIRED_MESSAGE;
    }

    if (dispositionRequiresTradeOffAcknowledgment(kind) && !isTradeOffAcknowledgmentSatisfied(tradeOffAcknowledgment)) {
      return TRADE_OFF_ACKNOWLEDGMENT_REQUIRED_MESSAGE;
    }

    if (isFindingApplyChangeDisposition(kind) && !recommendationIsActionable) {
      return RECOMMENDATION_ACTIONABILITY_REQUIRED_MESSAGE;
    }

    if (isFindingApplyChangeDisposition(kind) && approvedDecisionOverride !== null) {
      if (!isDispositionRationaleSatisfied(rationale)) {
        return APPROVED_DECISION_OVERRIDE_MESSAGE;
      }
    }

    if (
      isFindingApplyChangeDisposition(kind) &&
      !canConfirmFindingApplyChange({
        runId,
        findingId,
        overrideRecorded: applyChangePreviewOverride,
      })
    ) {
      return FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE;
    }

    return null;
  }

  const pendingDispositionBlockedReason = dispositionConfirmBlockedReason(pendingDispositionKind);

  return {
    findingId,
    runId,
    canMutate,
    history,
    activeWaiver,
    assignedToUserId,
    setAssignedToUserId,
    remediationDueUtc,
    setRemediationDueUtc,
    disposition,
    setDisposition,
    rationale,
    setRationale,
    revisitDueUtc,
    setRevisitDueUtc,
    evidenceRequestText,
    setEvidenceRequestText,
    waiverRationale,
    setWaiverRationale,
    waiverOwnerUserId,
    setWaiverOwnerUserId,
    waiverExpiresAtUtc,
    setWaiverExpiresAtUtc,
    waiverEvidenceRef,
    setWaiverEvidenceRef,
    statusMessage,
    errorMessage,
    remediationOwnerError,
    setRemediationOwnerError,
    waiverOwnerError,
    setWaiverOwnerError,
    busyAction,
    pendingDispositionConfirm,
    setPendingDispositionConfirm,
    pendingRevokeWaiverConfirm,
    setPendingRevokeWaiverConfirm,
    applyChangePreviewOverride,
    setApplyChangePreviewOverride,
    tradeOffAcknowledgment,
    setTradeOffAcknowledgment,
    showIncrementalRereviewLink,
    submitRemediationAssignment,
    submitDisposition,
    submitExplicitRemediation,
    submitWaiver,
    revokeWaiver,
    currentDisposition,
    mutationDisabledHintId,
    mutationDisabledReason,
    pendingDispositionKind,
    sponsorSynopsisCounts,
    sponsorSynopsisPackageTitle,
    recentDispositionActors,
    pendingDispositionBlockedReason,
  };
}
