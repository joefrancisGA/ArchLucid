"use client";

import { FindingInspectDispositionForm } from "./FindingInspectDispositionForm";
import { FindingInspectWaiverPanel } from "./FindingInspectWaiverPanel";
import {
  useFindingInspectDispositionControls,
  type FindingInspectDispositionControlsProps,
} from "./use-finding-inspect-disposition-controls";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";
import { findingInspectHasUnsavedEdits } from "@/lib/findings/finding-inspect-disposition-unsaved";

export type { FindingInspectDispositionControlsProps };

export type FindingInspectDispositionControlsGuardProps = FindingInspectDispositionControlsProps & {
  readonly remediationBaseline: import("@/lib/findings/finding-inspect-disposition-unsaved").FindingInspectRemediationBaseline;
  readonly dispositionBaseline: import("@/lib/findings/finding-inspect-disposition-unsaved").FindingInspectDispositionBaseline;
  readonly waiverBaseline: import("@/lib/findings/finding-inspect-disposition-unsaved").FindingInspectWaiverBaseline;
};

export function FindingInspectDispositionControls(props: FindingInspectDispositionControlsGuardProps) {
  const viewModel = useFindingInspectDispositionControls(props);
  const hasUnsavedEdits = findingInspectHasUnsavedEdits({
    canMutate: viewModel.canMutate,
    remediation: {
      assignedToUserId: viewModel.assignedToUserId,
      remediationDueUtc: viewModel.remediationDueUtc,
    },
    remediationBaseline: props.remediationBaseline,
    disposition: {
      disposition: viewModel.disposition,
      rationale: viewModel.rationale,
      revisitDueUtc: viewModel.revisitDueUtc,
      evidenceRequestText: viewModel.evidenceRequestText,
      tradeOffAcknowledgment: viewModel.tradeOffAcknowledgment,
    },
    dispositionBaseline: props.dispositionBaseline,
    waiver: {
      waiverRationale: viewModel.waiverRationale,
      waiverOwnerUserId: viewModel.waiverOwnerUserId,
      waiverExpiresAtUtc: viewModel.waiverExpiresAtUtc,
      waiverEvidenceRef: viewModel.waiverEvidenceRef,
    },
    waiverBaseline: props.waiverBaseline,
  });
  const documentGuards = useLivelihoodDocumentGuards({ when: hasUnsavedEdits });

  return (
    <>
      <FindingInspectDispositionForm
        findingId={viewModel.findingId}
        runId={viewModel.runId}
        canMutate={viewModel.canMutate}
        assignedToUserId={viewModel.assignedToUserId}
        setAssignedToUserId={viewModel.setAssignedToUserId}
        remediationDueUtc={viewModel.remediationDueUtc}
        setRemediationDueUtc={viewModel.setRemediationDueUtc}
        disposition={viewModel.disposition}
        setDisposition={viewModel.setDisposition}
        rationale={viewModel.rationale}
        setRationale={viewModel.setRationale}
        revisitDueUtc={viewModel.revisitDueUtc}
        setRevisitDueUtc={viewModel.setRevisitDueUtc}
        evidenceRequestText={viewModel.evidenceRequestText}
        setEvidenceRequestText={viewModel.setEvidenceRequestText}
        remediationOwnerError={viewModel.remediationOwnerError}
        setRemediationOwnerError={viewModel.setRemediationOwnerError}
        busyAction={viewModel.busyAction}
        pendingDispositionConfirm={viewModel.pendingDispositionConfirm}
        setPendingDispositionConfirm={viewModel.setPendingDispositionConfirm}
        applyChangePreviewOverride={viewModel.applyChangePreviewOverride}
        setApplyChangePreviewOverride={viewModel.setApplyChangePreviewOverride}
        tradeOffAcknowledgment={viewModel.tradeOffAcknowledgment}
        setTradeOffAcknowledgment={viewModel.setTradeOffAcknowledgment}
        showIncrementalRereviewLink={viewModel.showIncrementalRereviewLink}
        submitRemediationAssignment={viewModel.submitRemediationAssignment}
        submitDisposition={viewModel.submitDisposition}
        submitExplicitRemediation={viewModel.submitExplicitRemediation}
        currentDisposition={viewModel.currentDisposition}
        mutationDisabledHintId={viewModel.mutationDisabledHintId}
        mutationDisabledReason={viewModel.mutationDisabledReason}
        pendingDispositionKind={viewModel.pendingDispositionKind}
        pendingDispositionBlockedReason={viewModel.pendingDispositionBlockedReason}
        remediationLastSavedUtc={viewModel.remediationLastSavedUtc}
        remediationInlineSaveError={viewModel.remediationInlineSaveError}
        dispositionLastSavedUtc={viewModel.dispositionLastSavedUtc}
        dispositionInlineSaveError={viewModel.dispositionInlineSaveError}
      />
      <FindingInspectWaiverPanel
        canMutate={viewModel.canMutate}
        history={viewModel.history}
        activeWaiver={viewModel.activeWaiver}
        waiverRationale={viewModel.waiverRationale}
        setWaiverRationale={viewModel.setWaiverRationale}
        waiverOwnerUserId={viewModel.waiverOwnerUserId}
        setWaiverOwnerUserId={viewModel.setWaiverOwnerUserId}
        waiverExpiresAtUtc={viewModel.waiverExpiresAtUtc}
        setWaiverExpiresAtUtc={viewModel.setWaiverExpiresAtUtc}
        waiverEvidenceRef={viewModel.waiverEvidenceRef}
        setWaiverEvidenceRef={viewModel.setWaiverEvidenceRef}
        waiverOwnerError={viewModel.waiverOwnerError}
        setWaiverOwnerError={viewModel.setWaiverOwnerError}
        busyAction={viewModel.busyAction}
        pendingRevokeWaiverConfirm={viewModel.pendingRevokeWaiverConfirm}
        setPendingRevokeWaiverConfirm={viewModel.setPendingRevokeWaiverConfirm}
        submitWaiver={viewModel.submitWaiver}
        revokeWaiver={viewModel.revokeWaiver}
        mutationDisabledHintId={viewModel.mutationDisabledHintId}
        mutationDisabledReason={viewModel.mutationDisabledReason}
        waiverCreateSteps={viewModel.waiverCreateSteps}
        waiverCreateEmphasizedStepId={viewModel.waiverCreateEmphasizedStepId}
      />
      <LivelihoodDocumentGuardDialog
        open={documentGuards.dialogOpen}
        message={documentGuards.dialogMessage}
        onConfirmLeave={documentGuards.confirmLeave}
        onCancelLeave={documentGuards.cancelLeave}
      />
    </>
  );
}
