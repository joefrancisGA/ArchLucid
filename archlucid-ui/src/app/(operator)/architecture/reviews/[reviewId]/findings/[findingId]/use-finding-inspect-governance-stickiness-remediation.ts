"use client";

import { useEffect, useState } from "react";

import { upsertFindingRemediationAssignment } from "@/lib/api/finding-remediation-assignment-api";
import { validateRemediationOwnerInput } from "@/lib/findings/finding-governance-action-copy";
import {
  createFindingInspectRemediationBaseline,
  type FindingInspectRemediationBaseline,
} from "@/lib/findings/finding-inspect-disposition-unsaved";

export type UseFindingInspectGovernanceStickinessRemediationInput = {
  readonly findingId: string;
  readonly runId: string;
  readonly canMutate: boolean;
  readonly initialAssignedToUserId?: string | null;
  readonly initialRemediationDueUtc?: string | null;
  readonly busyAction: "remediation" | "disposition" | "mark-remediated" | "waiver" | "revoke-waiver" | null;
  readonly setBusyAction: (action: "remediation" | "disposition" | "mark-remediated" | "waiver" | "revoke-waiver" | null) => void;
  readonly setErrorMessage: (message: string | null) => void;
  readonly setStatusMessage: (message: string | null) => void;
  readonly resolveMutationError: (error: unknown) => string;
};

export function useFindingInspectGovernanceStickinessRemediation({
  findingId,
  runId,
  canMutate,
  initialAssignedToUserId = null,
  initialRemediationDueUtc = null,
  busyAction,
  setBusyAction,
  setErrorMessage,
  setStatusMessage,
  resolveMutationError,
}: UseFindingInspectGovernanceStickinessRemediationInput) {
  const [assignedToUserId, setAssignedToUserId] = useState(initialAssignedToUserId ?? "");
  const [remediationDueUtc, setRemediationDueUtc] = useState(
    initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "",
  );
  const [remediationOwnerError, setRemediationOwnerError] = useState<string | null>(null);
  const [remediationLastSavedUtc, setRemediationLastSavedUtc] = useState<string | null>(null);
  const [remediationInlineSaveError, setRemediationInlineSaveError] = useState<string | null>(null);
  const [remediationBaseline, setRemediationBaseline] = useState<FindingInspectRemediationBaseline>(() =>
    createFindingInspectRemediationBaseline(initialAssignedToUserId, initialRemediationDueUtc),
  );

  useEffect(() => {
    const nextAssigned = initialAssignedToUserId ?? "";
    const nextDue = initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "";

    setAssignedToUserId(nextAssigned);
    setRemediationDueUtc(nextDue);
    setRemediationBaseline(createFindingInspectRemediationBaseline(nextAssigned, nextDue));
  }, [findingId, initialAssignedToUserId, initialRemediationDueUtc]);

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
    setRemediationInlineSaveError(null);

    try {
      await upsertFindingRemediationAssignment(findingId, {
        runId,
        assignedToUserId: assignedToUserId.trim().length > 0 ? assignedToUserId.trim() : null,
        remediationDueUtc:
          remediationDueUtc.trim().length > 0 ? new Date(remediationDueUtc).toISOString() : null,
      });
      setRemediationLastSavedUtc(new Date().toISOString());
      setRemediationBaseline(
        createFindingInspectRemediationBaseline(assignedToUserId, remediationDueUtc),
      );
      setStatusMessage("Remediation assignment saved.");
    } catch (error) {
      const message = resolveMutationError(error);
      setRemediationInlineSaveError(message);
      setErrorMessage(message);
    } finally {
      setBusyAction(null);
    }
  }

  return {
    assignedToUserId,
    setAssignedToUserId,
    remediationDueUtc,
    setRemediationDueUtc,
    remediationOwnerError,
    setRemediationOwnerError,
    remediationLastSavedUtc,
    remediationInlineSaveError,
    remediationBaseline,
    submitRemediationAssignment,
  };
}
