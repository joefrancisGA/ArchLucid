"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listFindingDispositions,
  listRiskExceptions,
  recordFindingDisposition,
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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

type GovernanceBusyAction = "disposition" | "mark-remediated" | null;

type PendingDispositionConfirm = "disposition" | "mark-remediated";

export type UseFindingInspectGovernanceStickinessDispositionsInput = {
  readonly findingId: string;
  readonly runId: string;
  readonly packageTitle?: string | null;
  readonly recommendation?: string | null;
  readonly recommendedActions?: readonly string[];
  readonly approvedDecisionTitles?: readonly string[];
  readonly canMutate: boolean;
  readonly setActiveWaiver: (waiver: RiskExceptionRecord | null) => void;
  readonly setErrorMessage: (message: string | null) => void;
  readonly setStatusMessage: (message: string | null) => void;
  readonly busyAction: GovernanceBusyAction | "remediation" | "waiver" | "revoke-waiver" | null;
  readonly setBusyAction: (action: GovernanceBusyAction | "remediation" | "waiver" | "revoke-waiver" | null) => void;
  readonly resolveMutationError: (error: unknown) => string;
};

function latestDispositionLabel(history: readonly FindingDispositionEvent[]): string {
  if (history.length === 0) {
    return "No disposition recorded";
  }

  return history[0]?.disposition ?? "No disposition recorded";
}

export function useFindingInspectGovernanceStickinessDispositions({
  findingId,
  runId,
  packageTitle = null,
  recommendation = null,
  recommendedActions = [],
  approvedDecisionTitles = [],
  canMutate,
  setActiveWaiver,
  setErrorMessage,
  setStatusMessage,
  busyAction,
  setBusyAction,
  resolveMutationError,
}: UseFindingInspectGovernanceStickinessDispositionsInput) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [history, setHistory] = useState<FindingDispositionEvent[]>([]);
  const [disposition, setDisposition] = useState<FindingDispositionKind>("Accepted");
  const [rationale, setRationale] = useState("");
  const [revisitDueUtc, setRevisitDueUtc] = useState("");
  const [evidenceRequestText, setEvidenceRequestText] = useState("");
  const [pendingDispositionConfirm, setPendingDispositionConfirm] = useState<PendingDispositionConfirm | null>(
    null,
  );
  const [applyChangePreviewOverride, setApplyChangePreviewOverride] = useState(false);
  const [tradeOffAcknowledgment, setTradeOffAcknowledgment] = useState("");
  const [showIncrementalRereviewLink, setShowIncrementalRereviewLink] = useState(false);
  const [dispositionLastSavedUtc, setDispositionLastSavedUtc] = useState<string | null>(null);
  const [dispositionInlineSaveError, setDispositionInlineSaveError] = useState<string | null>(null);

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
  }, [findingId, setActiveWaiver]);

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
              : "Governance approval workflow data unavailable for this finding.",
          );
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [buyerPolishedShell, reload, setErrorMessage]);

  async function submitDisposition(): Promise<void> {
    if (!canMutate || busyAction !== null) {
      return;
    }

    setBusyAction("disposition");
    setErrorMessage(null);
    setStatusMessage(null);
    setDispositionInlineSaveError(null);

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

      setDispositionLastSavedUtc(new Date().toISOString());
      setStatusMessage(concurrentNotice ?? "Disposition recorded.");
    } catch (error: unknown) {
      const message = resolveMutationError(error);
      setDispositionInlineSaveError(message);
      setErrorMessage(message);
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
    setDispositionInlineSaveError(null);

    try {
      const saved = await recordFindingDisposition(findingId, {
        disposition: "Remediated",
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
      });

      const refreshed = await reload();
      const concurrentNotice = resolveDispositionConcurrentUpdateNotice(saved, refreshed);

      setDispositionLastSavedUtc(new Date().toISOString());
      setStatusMessage(concurrentNotice ?? "Finding marked as remediated.");
      setShowIncrementalRereviewLink(true);
    } catch (error: unknown) {
      const message = resolveMutationError(error);
      setDispositionInlineSaveError(message);
      setErrorMessage(message);
    } finally {
      setBusyAction(null);
    }
  }

  const currentDisposition = latestDispositionLabel(history);
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
    history,
    reload,
    disposition,
    setDisposition,
    rationale,
    setRationale,
    revisitDueUtc,
    setRevisitDueUtc,
    evidenceRequestText,
    setEvidenceRequestText,
    pendingDispositionConfirm,
    setPendingDispositionConfirm,
    applyChangePreviewOverride,
    setApplyChangePreviewOverride,
    tradeOffAcknowledgment,
    setTradeOffAcknowledgment,
    showIncrementalRereviewLink,
    submitDisposition,
    submitExplicitRemediation,
    currentDisposition,
    pendingDispositionKind,
    sponsorSynopsisCounts,
    sponsorSynopsisPackageTitle,
    recentDispositionActors,
    pendingDispositionBlockedReason,
    dispositionLastSavedUtc,
    dispositionInlineSaveError,
  };
}
