"use client";

import { useCallback, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";

import { useFindingInspectGovernanceStickinessDispositions } from "./use-finding-inspect-governance-stickiness-dispositions";
import { useFindingInspectGovernanceStickinessWaivers } from "./use-finding-inspect-governance-stickiness-waivers";
import { useFindingInspectGovernanceStickinessRemediation } from "./use-finding-inspect-governance-stickiness-remediation";

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
  const [activeWaiver, setActiveWaiver] = useState<RiskExceptionRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    "remediation" | "disposition" | "mark-remediated" | "waiver" | "revoke-waiver" | null
  >(null);

  const resolveMutationError = useCallback(
    (error: unknown): string => {
      const failure = toApiLoadFailure(error);

      if (buyerPolishedShell) {
        return "This finding update could not be saved right now. Your entries are preserved — try again in a moment.";
      }

      return failure.message;
    },
    [buyerPolishedShell],
  );

  const dispositions = useFindingInspectGovernanceStickinessDispositions({
    findingId,
    runId,
    packageTitle,
    recommendation,
    recommendedActions,
    approvedDecisionTitles,
    canMutate,
    setActiveWaiver,
    setErrorMessage,
    setStatusMessage,
    busyAction,
    setBusyAction,
    resolveMutationError,
  });

  const waivers = useFindingInspectGovernanceStickinessWaivers({
    findingId,
    runId,
    canMutate,
    activeWaiver,
    reload: dispositions.reload,
    busyAction,
    setBusyAction,
    setErrorMessage,
    setStatusMessage,
    resolveMutationError,
  });

  const remediation = useFindingInspectGovernanceStickinessRemediation({
    findingId,
    runId,
    canMutate,
    initialAssignedToUserId,
    initialRemediationDueUtc,
    busyAction,
    setBusyAction,
    setErrorMessage,
    setStatusMessage,
    resolveMutationError,
  });

  const mutationDisabledHintId = "finding-governance-stickiness-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();

  return {
    findingId,
    runId,
    canMutate,
    history: dispositions.history,
    activeWaiver,
    assignedToUserId: remediation.assignedToUserId,
    setAssignedToUserId: remediation.setAssignedToUserId,
    remediationDueUtc: remediation.remediationDueUtc,
    setRemediationDueUtc: remediation.setRemediationDueUtc,
    disposition: dispositions.disposition,
    setDisposition: dispositions.setDisposition,
    rationale: dispositions.rationale,
    setRationale: dispositions.setRationale,
    revisitDueUtc: dispositions.revisitDueUtc,
    setRevisitDueUtc: dispositions.setRevisitDueUtc,
    evidenceRequestText: dispositions.evidenceRequestText,
    setEvidenceRequestText: dispositions.setEvidenceRequestText,
    waiverRationale: waivers.waiverRationale,
    setWaiverRationale: waivers.setWaiverRationale,
    waiverOwnerUserId: waivers.waiverOwnerUserId,
    setWaiverOwnerUserId: waivers.setWaiverOwnerUserId,
    waiverExpiresAtUtc: waivers.waiverExpiresAtUtc,
    setWaiverExpiresAtUtc: waivers.setWaiverExpiresAtUtc,
    waiverEvidenceRef: waivers.waiverEvidenceRef,
    setWaiverEvidenceRef: waivers.setWaiverEvidenceRef,
    statusMessage,
    errorMessage,
    remediationOwnerError: remediation.remediationOwnerError,
    setRemediationOwnerError: remediation.setRemediationOwnerError,
    waiverOwnerError: waivers.waiverOwnerError,
    setWaiverOwnerError: waivers.setWaiverOwnerError,
    busyAction,
    pendingDispositionConfirm: dispositions.pendingDispositionConfirm,
    setPendingDispositionConfirm: dispositions.setPendingDispositionConfirm,
    pendingRevokeWaiverConfirm: waivers.pendingRevokeWaiverConfirm,
    setPendingRevokeWaiverConfirm: waivers.setPendingRevokeWaiverConfirm,
    applyChangePreviewOverride: dispositions.applyChangePreviewOverride,
    setApplyChangePreviewOverride: dispositions.setApplyChangePreviewOverride,
    tradeOffAcknowledgment: dispositions.tradeOffAcknowledgment,
    setTradeOffAcknowledgment: dispositions.setTradeOffAcknowledgment,
    showIncrementalRereviewLink: dispositions.showIncrementalRereviewLink,
    submitRemediationAssignment: remediation.submitRemediationAssignment,
    submitDisposition: dispositions.submitDisposition,
    submitExplicitRemediation: dispositions.submitExplicitRemediation,
    submitWaiver: waivers.submitWaiver,
    revokeWaiver: waivers.revokeWaiver,
    currentDisposition: dispositions.currentDisposition,
    mutationDisabledHintId,
    mutationDisabledReason,
    pendingDispositionKind: dispositions.pendingDispositionKind,
    sponsorSynopsisCounts: dispositions.sponsorSynopsisCounts,
    sponsorSynopsisPackageTitle: dispositions.sponsorSynopsisPackageTitle,
    recentDispositionActors: dispositions.recentDispositionActors,
    pendingDispositionBlockedReason: dispositions.pendingDispositionBlockedReason,
    remediationLastSavedUtc: remediation.remediationLastSavedUtc,
    remediationInlineSaveError: remediation.remediationInlineSaveError,
    dispositionLastSavedUtc: dispositions.dispositionLastSavedUtc,
    dispositionInlineSaveError: dispositions.dispositionInlineSaveError,
  };
}
