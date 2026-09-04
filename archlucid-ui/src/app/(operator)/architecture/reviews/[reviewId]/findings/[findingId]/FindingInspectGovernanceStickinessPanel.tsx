"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  findingInspectDispositionConfirmHrefFromSearch,
  parseFindingInspectDispositionConfirmFromSearch,
  type FindingInspectDispositionConfirmUrlValue,
} from "@/lib/findings/finding-inspect-disposition-confirm-url";
import {
  findingInspectGovernancePanelHrefFromSearch,
  parseFindingInspectGovernancePanelFromSearch,
  parseFindingInspectWaiverConfirmOpenFromSearch,
  parseFindingInspectWaiverRevokeConfirmOpenFromSearch,
  type FindingInspectGovernancePanelId,
} from "@/lib/findings/finding-inspect-governance-panel-url";

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
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}/findings/${props.findingId}/inspect`;
  const searchParams = useSearchParams();
  const urlGovPanel = parseFindingInspectGovernancePanelFromSearch(searchParams.get("govPanel"));
  const urlWaiverConfirm = parseFindingInspectWaiverConfirmOpenFromSearch(searchParams.get("waiverConfirm"));
  const urlWaiverRevokeConfirm = parseFindingInspectWaiverRevokeConfirmOpenFromSearch(
    searchParams.get("waiverRevokeConfirm"),
  );
  const urlDispConfirm = parseFindingInspectDispositionConfirmFromSearch(searchParams.get("dispConfirm"));
  const stickiness = useFindingInspectGovernanceStickiness(props);
  const scrolledPanelRef = useRef<FindingInspectGovernancePanelId | null>(null);

  const syncGovernancePanelToUrl = (
    panel: FindingInspectGovernancePanelId | null,
    waiverConfirmOpen: boolean,
    dispConfirm: FindingInspectDispositionConfirmUrlValue | null = urlDispConfirm,
    waiverRevokeConfirmOpen: boolean = urlWaiverRevokeConfirm,
  ): void => {
    const panelHref = findingInspectGovernancePanelHrefFromSearch(
      searchParams.toString(),
      { panel, waiverConfirmOpen, waiverRevokeConfirmOpen },
      pathname,
    );
    const questionIndex = panelHref.indexOf("?");
    const panelPath = questionIndex >= 0 ? panelHref.slice(0, questionIndex) : panelHref;
    const panelSearch = questionIndex >= 0 ? panelHref.slice(questionIndex + 1) : "";

    router.replace(
      findingInspectDispositionConfirmHrefFromSearch(panelSearch, dispConfirm, panelPath),
      { scroll: false },
    );
  };

  useEffect(() => {
    if (urlWaiverRevokeConfirm) {
      stickiness.setPendingRevokeWaiverConfirm(true);
    }
  }, [stickiness.setPendingRevokeWaiverConfirm, urlWaiverRevokeConfirm]);

  useEffect(() => {
    if (urlWaiverConfirm) {
      stickiness.setPendingWaiverCreateConfirm(true);
    }
  }, [stickiness.setPendingWaiverCreateConfirm, urlWaiverConfirm]);

  useEffect(() => {
    if (urlDispConfirm !== null) {
      stickiness.setPendingDispositionConfirm(urlDispConfirm);
    }
  }, [stickiness.setPendingDispositionConfirm, urlDispConfirm]);

  useEffect(() => {
    if (urlGovPanel === null || scrolledPanelRef.current === urlGovPanel) {
      return;
    }

    scrolledPanelRef.current = urlGovPanel;
    const targetId =
      urlGovPanel === "waiver"
        ? "finding-inspect-waiver-panel"
        : urlGovPanel === "remediation"
          ? "finding-inspect-remediation-panel"
          : "finding-inspect-disposition-panel";

    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [urlGovPanel]);

  const setPendingRevokeWaiverConfirmWithUrl = (open: boolean) => {
    stickiness.setPendingRevokeWaiverConfirm(open);
    syncGovernancePanelToUrl(urlGovPanel, urlWaiverConfirm, urlDispConfirm, open);
  };

  const setPendingWaiverCreateConfirmWithUrl = (open: boolean) => {
    stickiness.setPendingWaiverCreateConfirm(open);
    syncGovernancePanelToUrl(urlGovPanel, open, urlDispConfirm, urlWaiverRevokeConfirm);
  };

  const setPendingDispositionConfirmWithUrl = (
    confirm: FindingInspectDispositionConfirmUrlValue | null,
  ) => {
    stickiness.setPendingDispositionConfirm(confirm);
    syncGovernancePanelToUrl(urlGovPanel, urlWaiverConfirm, confirm, urlWaiverRevokeConfirm);
  };

  return (
    <div className={cn(OPERATOR_LAYOUT.sectionStack, "rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40", OPERATOR_TYPOGRAPHY.body)}>
      <FindingInspectStickinessSummary
        recentDispositionActors={stickiness.recentDispositionActors}
        dispositionHistoryAsOfUtc={stickiness.dispositionHistoryAsOfUtc}
        onRefreshDispositionHistory={() => {
          void stickiness.refreshDispositionHistory();
        }}
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
        setPendingDispositionConfirm={setPendingDispositionConfirmWithUrl}
        pendingRevokeWaiverConfirm={stickiness.pendingRevokeWaiverConfirm}
        setPendingRevokeWaiverConfirm={setPendingRevokeWaiverConfirmWithUrl}
        pendingWaiverCreateConfirm={stickiness.pendingWaiverCreateConfirm}
        setPendingWaiverCreateConfirm={setPendingWaiverCreateConfirmWithUrl}
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
        remediationLastSavedUtc={stickiness.remediationLastSavedUtc}
        remediationInlineSaveError={stickiness.remediationInlineSaveError}
        remediationBaseline={stickiness.remediationBaseline}
        dispositionLastSavedUtc={stickiness.dispositionLastSavedUtc}
        dispositionInlineSaveError={stickiness.dispositionInlineSaveError}
        dispositionBaseline={stickiness.dispositionBaseline}
        waiverBaseline={stickiness.waiverBaseline}
      />
    </div>
  );
}
