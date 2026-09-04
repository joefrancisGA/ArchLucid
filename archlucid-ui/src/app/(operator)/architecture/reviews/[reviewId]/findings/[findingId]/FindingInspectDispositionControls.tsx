"use client";

import { FindingInspectDispositionForm } from "./FindingInspectDispositionForm";
import { FindingInspectWaiverPanel } from "./FindingInspectWaiverPanel";
import {
  useFindingInspectDispositionControls,
  type FindingInspectDispositionControlsProps,
} from "./use-finding-inspect-disposition-controls";

export type { FindingInspectDispositionControlsProps };

export function FindingInspectDispositionControls(props: FindingInspectDispositionControlsProps) {
  const viewModel = useFindingInspectDispositionControls(props);

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
    </>
  );
}
