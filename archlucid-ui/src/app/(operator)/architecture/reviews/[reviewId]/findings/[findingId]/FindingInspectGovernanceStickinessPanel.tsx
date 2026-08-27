"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FindingInspectDispositionControls } from "./FindingInspectDispositionControls";
import { FindingInspectStickinessSummary } from "./FindingInspectStickinessSummary";
import {
  useFindingInspectGovernanceStickiness,
  type FindingInspectGovernanceStickinessPanelProps,
} from "./use-finding-inspect-governance-stickiness";

export type { FindingInspectGovernanceStickinessPanelProps };

/** TB-058/TB-059 operator workflow on the evidence trace page (governance action region). */
export function FindingInspectGovernanceStickinessPanel(
  props: FindingInspectGovernanceStickinessPanelProps,
) {
  const stickiness = useFindingInspectGovernanceStickiness(props);

  return (
    <div className={cn(OPERATOR_LAYOUT.sectionStack, "rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40", OPERATOR_TYPOGRAPHY.body)}>
      <FindingInspectStickinessSummary
        recentDispositionActors={stickiness.recentDispositionActors}
        mutationDisabledHintId={stickiness.mutationDisabledHintId}
        mutationDisabledReason={stickiness.mutationDisabledReason}
        sponsorSynopsisPackageTitle={stickiness.sponsorSynopsisPackageTitle}
        sponsorSynopsisCounts={stickiness.sponsorSynopsisCounts}
        runId={stickiness.runId}
        statusMessage={stickiness.statusMessage}
        errorMessage={stickiness.errorMessage}
      />
      <FindingInspectDispositionControls
        findingId={stickiness.findingId}
        runId={stickiness.runId}
        canMutate={stickiness.canMutate}
        history={stickiness.history}
        activeWaiver={stickiness.activeWaiver}
        assignedToUserId={stickiness.assignedToUserId}
        setAssignedToUserId={stickiness.setAssignedToUserId}
        remediationDueUtc={stickiness.remediationDueUtc}
        setRemediationDueUtc={stickiness.setRemediationDueUtc}
        disposition={stickiness.disposition}
        setDisposition={stickiness.setDisposition}
        rationale={stickiness.rationale}
        setRationale={stickiness.setRationale}
        revisitDueUtc={stickiness.revisitDueUtc}
        setRevisitDueUtc={stickiness.setRevisitDueUtc}
        evidenceRequestText={stickiness.evidenceRequestText}
        setEvidenceRequestText={stickiness.setEvidenceRequestText}
        waiverRationale={stickiness.waiverRationale}
        setWaiverRationale={stickiness.setWaiverRationale}
        waiverOwnerUserId={stickiness.waiverOwnerUserId}
        setWaiverOwnerUserId={stickiness.setWaiverOwnerUserId}
        waiverExpiresAtUtc={stickiness.waiverExpiresAtUtc}
        setWaiverExpiresAtUtc={stickiness.setWaiverExpiresAtUtc}
        waiverEvidenceRef={stickiness.waiverEvidenceRef}
        setWaiverEvidenceRef={stickiness.setWaiverEvidenceRef}
        remediationOwnerError={stickiness.remediationOwnerError}
        setRemediationOwnerError={stickiness.setRemediationOwnerError}
        waiverOwnerError={stickiness.waiverOwnerError}
        setWaiverOwnerError={stickiness.setWaiverOwnerError}
        busyAction={stickiness.busyAction}
        pendingDispositionConfirm={stickiness.pendingDispositionConfirm}
        setPendingDispositionConfirm={stickiness.setPendingDispositionConfirm}
        pendingRevokeWaiverConfirm={stickiness.pendingRevokeWaiverConfirm}
        setPendingRevokeWaiverConfirm={stickiness.setPendingRevokeWaiverConfirm}
        applyChangePreviewOverride={stickiness.applyChangePreviewOverride}
        setApplyChangePreviewOverride={stickiness.setApplyChangePreviewOverride}
        tradeOffAcknowledgment={stickiness.tradeOffAcknowledgment}
        setTradeOffAcknowledgment={stickiness.setTradeOffAcknowledgment}
        showIncrementalRereviewLink={stickiness.showIncrementalRereviewLink}
        submitRemediationAssignment={stickiness.submitRemediationAssignment}
        submitDisposition={stickiness.submitDisposition}
        submitExplicitRemediation={stickiness.submitExplicitRemediation}
        submitWaiver={stickiness.submitWaiver}
        revokeWaiver={stickiness.revokeWaiver}
        currentDisposition={stickiness.currentDisposition}
        mutationDisabledHintId={stickiness.mutationDisabledHintId}
        mutationDisabledReason={stickiness.mutationDisabledReason}
        pendingDispositionKind={stickiness.pendingDispositionKind}
        pendingDispositionBlockedReason={stickiness.pendingDispositionBlockedReason}
      />
    </div>
  );
}
