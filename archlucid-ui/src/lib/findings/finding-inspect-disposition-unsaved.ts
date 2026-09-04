import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

export type FindingInspectRemediationBaseline = {
  readonly assignedToUserId: string;
  readonly remediationDueUtc: string;
};

export type FindingInspectDispositionBaseline = {
  readonly disposition: FindingDispositionKind;
  readonly rationale: string;
  readonly revisitDueUtc: string;
  readonly evidenceRequestText: string;
  readonly tradeOffAcknowledgment: string;
};

export type FindingInspectWaiverBaseline = {
  readonly waiverRationale: string;
  readonly waiverOwnerUserId: string;
  readonly waiverExpiresAtUtc: string;
  readonly waiverEvidenceRef: string;
};

export function createFindingInspectRemediationBaseline(
  assignedToUserId: string | null | undefined,
  remediationDueUtc: string | null | undefined,
): FindingInspectRemediationBaseline {
  return {
    assignedToUserId: (assignedToUserId ?? "").trim(),
    remediationDueUtc: remediationDueUtc ? remediationDueUtc.slice(0, 16) : "",
  };
}

export const EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE: FindingInspectDispositionBaseline = {
  disposition: "Accepted",
  rationale: "",
  revisitDueUtc: "",
  evidenceRequestText: "",
  tradeOffAcknowledgment: "",
};

export const EMPTY_FINDING_INSPECT_WAIVER_BASELINE: FindingInspectWaiverBaseline = {
  waiverRationale: "",
  waiverOwnerUserId: "",
  waiverExpiresAtUtc: "",
  waiverEvidenceRef: "",
};

export function findingInspectRemediationHasUnsavedEdits(
  current: FindingInspectRemediationBaseline,
  baseline: FindingInspectRemediationBaseline,
): boolean {
  return (
    current.assignedToUserId.trim() !== baseline.assignedToUserId.trim()
    || current.remediationDueUtc.trim() !== baseline.remediationDueUtc.trim()
  );
}

export function findingInspectDispositionHasUnsavedEdits(
  current: FindingInspectDispositionBaseline,
  baseline: FindingInspectDispositionBaseline,
): boolean {
  return (
    current.disposition !== baseline.disposition
    || current.rationale.trim() !== baseline.rationale.trim()
    || current.revisitDueUtc.trim() !== baseline.revisitDueUtc.trim()
    || current.evidenceRequestText.trim() !== baseline.evidenceRequestText.trim()
    || current.tradeOffAcknowledgment.trim() !== baseline.tradeOffAcknowledgment.trim()
  );
}

export function findingInspectWaiverHasUnsavedEdits(
  current: FindingInspectWaiverBaseline,
  baseline: FindingInspectWaiverBaseline,
): boolean {
  return (
    current.waiverRationale.trim() !== baseline.waiverRationale.trim()
    || current.waiverOwnerUserId.trim() !== baseline.waiverOwnerUserId.trim()
    || current.waiverExpiresAtUtc.trim() !== baseline.waiverExpiresAtUtc.trim()
    || current.waiverEvidenceRef.trim() !== baseline.waiverEvidenceRef.trim()
  );
}

export type FindingInspectUnsavedEditsInput = {
  readonly canMutate: boolean;
  readonly remediation: FindingInspectRemediationBaseline;
  readonly remediationBaseline: FindingInspectRemediationBaseline;
  readonly disposition: FindingInspectDispositionBaseline;
  readonly dispositionBaseline: FindingInspectDispositionBaseline;
  readonly waiver: FindingInspectWaiverBaseline;
  readonly waiverBaseline: FindingInspectWaiverBaseline;
};

export function findingInspectHasUnsavedEdits(input: FindingInspectUnsavedEditsInput): boolean {
  if (!input.canMutate) {
    return false;
  }

  return (
    findingInspectRemediationHasUnsavedEdits(input.remediation, input.remediationBaseline)
    || findingInspectDispositionHasUnsavedEdits(input.disposition, input.dispositionBaseline)
    || findingInspectWaiverHasUnsavedEdits(input.waiver, input.waiverBaseline)
  );
}
