import type { FindingDispositionKind, FindingDispositionEvent, RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";
import {
  resolveRiskExceptionCreateEmphasizedStepId,
  resolveRiskExceptionCreateSteps,
} from "@/lib/risk-exception-create-checklist";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

export type GovernanceBusyAction =
  | "remediation"
  | "disposition"
  | "mark-remediated"
  | "waiver"
  | "revoke-waiver"
  | null;

export type PendingDispositionConfirm = "disposition" | "mark-remediated";

export type FindingInspectDispositionControlsProps = {
  readonly findingId: string;
  readonly runId: string;
  readonly canMutate: boolean;
  readonly history: readonly FindingDispositionEvent[];
  readonly activeWaiver: RiskExceptionRecord | null;
  readonly assignedToUserId: string;
  readonly setAssignedToUserId: (value: string) => void;
  readonly remediationDueUtc: string;
  readonly setRemediationDueUtc: (value: string) => void;
  readonly disposition: FindingDispositionKind;
  readonly setDisposition: (value: FindingDispositionKind) => void;
  readonly rationale: string;
  readonly setRationale: (value: string) => void;
  readonly revisitDueUtc: string;
  readonly setRevisitDueUtc: (value: string) => void;
  readonly evidenceRequestText: string;
  readonly setEvidenceRequestText: (value: string) => void;
  readonly waiverRationale: string;
  readonly setWaiverRationale: (value: string) => void;
  readonly waiverOwnerUserId: string;
  readonly setWaiverOwnerUserId: (value: string) => void;
  readonly waiverExpiresAtUtc: string;
  readonly setWaiverExpiresAtUtc: (value: string) => void;
  readonly waiverEvidenceRef: string;
  readonly setWaiverEvidenceRef: (value: string) => void;
  readonly remediationOwnerError: string | null;
  readonly setRemediationOwnerError: (value: string | null) => void;
  readonly waiverOwnerError: string | null;
  readonly setWaiverOwnerError: (value: string | null) => void;
  readonly busyAction: GovernanceBusyAction;
  readonly pendingDispositionConfirm: PendingDispositionConfirm | null;
  readonly setPendingDispositionConfirm: (value: PendingDispositionConfirm | null) => void;
  readonly pendingRevokeWaiverConfirm: boolean;
  readonly setPendingRevokeWaiverConfirm: (value: boolean) => void;
  readonly applyChangePreviewOverride: boolean;
  readonly setApplyChangePreviewOverride: (value: boolean) => void;
  readonly tradeOffAcknowledgment: string;
  readonly setTradeOffAcknowledgment: (value: string) => void;
  readonly showIncrementalRereviewLink: boolean;
  readonly submitRemediationAssignment: () => void | Promise<void>;
  readonly submitDisposition: () => void | Promise<void>;
  readonly submitExplicitRemediation: () => void | Promise<void>;
  readonly submitWaiver: () => void | Promise<void>;
  readonly revokeWaiver: () => void | Promise<void>;
  readonly currentDisposition: string;
  readonly mutationDisabledHintId: string;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
  readonly pendingDispositionKind: FindingDispositionKind;
  readonly pendingDispositionBlockedReason: string | null;
  readonly remediationLastSavedUtc: string | null;
  readonly remediationInlineSaveError: string | null;
  readonly dispositionLastSavedUtc: string | null;
  readonly dispositionInlineSaveError: string | null;
};

export function useFindingInspectDispositionControls(props: FindingInspectDispositionControlsProps) {
  const waiverCreateChecklistInput = {
    ownerAssigned: props.waiverOwnerUserId.trim().length > 0 && props.waiverOwnerError === null,
    evidenceDocumented: props.waiverRationale.trim().length > 0 && props.waiverEvidenceRef.trim().length > 0,
    waiverCreated: props.activeWaiver !== null,
  };
  const waiverCreateSteps = resolveRiskExceptionCreateSteps(waiverCreateChecklistInput);
  const waiverCreateEmphasizedStepId = resolveRiskExceptionCreateEmphasizedStepId(waiverCreateChecklistInput);

  return {
    ...props,
    waiverCreateSteps,
    waiverCreateEmphasizedStepId,
  };
}

export type FindingInspectDispositionControlsViewModel = ReturnType<typeof useFindingInspectDispositionControls>;
