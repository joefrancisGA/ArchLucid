"use client";

import {
  createRiskException,
  defaultRiskExceptionExpiresAtUtc,
  revokeRiskException,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { validateRemediationOwnerInput } from "@/lib/findings/finding-governance-action-copy";
import {
  EMPTY_FINDING_INSPECT_WAIVER_BASELINE,
  type FindingInspectWaiverBaseline,
} from "@/lib/findings/finding-inspect-disposition-unsaved";
import { useState } from "react";

export type UseFindingInspectGovernanceStickinessWaiversInput = {
  readonly findingId: string;
  readonly runId: string;
  readonly canMutate: boolean;
  readonly activeWaiver: RiskExceptionRecord | null;
  readonly reload: () => Promise<unknown>;
  readonly busyAction: "remediation" | "disposition" | "mark-remediated" | "waiver" | "revoke-waiver" | null;
  readonly setBusyAction: (action: "remediation" | "disposition" | "mark-remediated" | "waiver" | "revoke-waiver" | null) => void;
  readonly setErrorMessage: (message: string | null) => void;
  readonly setStatusMessage: (message: string | null) => void;
  readonly resolveMutationError: (error: unknown) => string;
};

export function useFindingInspectGovernanceStickinessWaivers({
  findingId,
  runId,
  canMutate,
  activeWaiver,
  reload,
  busyAction,
  setBusyAction,
  setErrorMessage,
  setStatusMessage,
  resolveMutationError,
}: UseFindingInspectGovernanceStickinessWaiversInput) {
  const [waiverRationale, setWaiverRationale] = useState("");
  const [waiverOwnerUserId, setWaiverOwnerUserId] = useState("");
  const [waiverExpiresAtUtc, setWaiverExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [waiverEvidenceRef, setWaiverEvidenceRef] = useState("");
  const [waiverOwnerError, setWaiverOwnerError] = useState<string | null>(null);
  const [pendingRevokeWaiverConfirm, setPendingRevokeWaiverConfirm] = useState(false);
  const [waiverBaseline, setWaiverBaseline] = useState<FindingInspectWaiverBaseline>(
    EMPTY_FINDING_INSPECT_WAIVER_BASELINE,
  );

  function captureWaiverBaseline(): FindingInspectWaiverBaseline {
    return {
      waiverRationale,
      waiverOwnerUserId,
      waiverExpiresAtUtc,
      waiverEvidenceRef,
    };
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
      setWaiverBaseline(captureWaiverBaseline());
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

  return {
    waiverRationale,
    setWaiverRationale,
    waiverOwnerUserId,
    setWaiverOwnerUserId,
    waiverExpiresAtUtc,
    setWaiverExpiresAtUtc,
    waiverEvidenceRef,
    setWaiverEvidenceRef,
    waiverOwnerError,
    setWaiverOwnerError,
    pendingRevokeWaiverConfirm,
    setPendingRevokeWaiverConfirm,
    submitWaiver,
    revokeWaiver,
    waiverBaseline,
  };
}
