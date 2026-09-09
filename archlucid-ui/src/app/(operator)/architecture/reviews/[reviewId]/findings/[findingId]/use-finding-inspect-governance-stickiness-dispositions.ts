"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  listFindingDispositions,
  listRiskExceptions,
  recordFindingDispositionWith401Resume,
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { findingDispositionsBlockedReason } from "@/lib/governance/finding-dispositions-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { findingDispositionMutationBlockedReason } from "@/lib/findings/finding-disposition-mutation-blocked-reason";
import { isLivelihoodMutation401RedirectError } from "@/lib/auth/livelihood-mutation-401-resume";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import { useResumePendingLivelihoodMutation } from "@/hooks/use-resume-pending-livelihood-mutation";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE } from "@/lib/buyer/buyer-polish-copy";
import { useProductionDeskChrome, useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { buildSponsorStoryDispositionCountsFromRows } from "@/lib/sponsor-story-synopsis";
import { resolveDispositionConcurrentUpdateNotice } from "@/lib/findings/finding-disposition-concurrent-update";
import {
  readFindingDispositionConflictFromError,
  type FindingDispositionConflictDetail,
} from "@/lib/findings/finding-disposition-conflict";
import { resolveExpectedCurrentDispositionRowVersion } from "@/lib/findings/finding-expected-current-disposition-row-version";
import { collabRecentActorsFromDispositionHistory } from "@/lib/collab-recent-actor-presence";
import {
  buildFindingApplyChangeDispositionAttestation,
  canConfirmFindingApplyChange,
  FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE,
  isFindingApplyChangeDisposition,
} from "@/lib/findings/finding-apply-change-preview-gate";
import {
  EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE,
  type FindingInspectDispositionBaseline,
} from "@/lib/findings/finding-inspect-disposition-unsaved";
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
  readonly latestDispositionRowVersionBase64?: string | null;
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
  latestDispositionRowVersionBase64 = null,
}: UseFindingInspectGovernanceStickinessDispositionsInput) {
  const buyerPolishedShell = useProductionEvalChrome();
  const isWorkingDesk = useProductionDeskChrome();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const livelihoodReturnPath =
    searchParams.toString().length > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
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
  const [architectRestatement, setArchitectRestatement] = useState("");
  const [showIncrementalRereviewLink, setShowIncrementalRereviewLink] = useState(false);
  const [dispositionLastSavedUtc, setDispositionLastSavedUtc] = useState<string | null>(null);
  const [dispositionInlineSaveError, setDispositionInlineSaveError] = useState<string | null>(null);
  const [dispositionBaseline, setDispositionBaseline] = useState<FindingInspectDispositionBaseline>(
    EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE,
  );
  const [dispositionHistoryAsOfUtc, setDispositionHistoryAsOfUtc] = useState<string | null>(null);
  const [dispositionHistoryFailure, setDispositionHistoryFailure] = useState<ApiLoadFailureState | null>(null);
  const [dispositionHistoryBlockedReason, setDispositionHistoryBlockedReason] = useState<string | null>(null);
  const [dispositionConflict, setDispositionConflict] = useState<FindingDispositionConflictDetail | null>(
    null,
  );

  function captureDispositionBaseline(): FindingInspectDispositionBaseline {
    return {
      disposition,
      rationale,
      revisitDueUtc,
      evidenceRequestText,
      tradeOffAcknowledgment,
      architectRestatement,
    };
  }

  const reload = useCallback(async (): Promise<FindingDispositionEvent[]> => {
    setDispositionHistoryFailure(null);
    setDispositionHistoryBlockedReason(null);

    try {
      const [dispositions, waivers] = await Promise.all([
        listFindingDispositions(findingId),
        listRiskExceptions(),
      ]);

      setHistory(dispositions);
      setActiveWaiver(
        waivers.find((w) => w.findingId === findingId && w.status === "Active") ?? null,
      );
      setDispositionHistoryAsOfUtc(new Date().toISOString());

      return dispositions;
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      setDispositionHistoryFailure(failure);
      setDispositionHistoryBlockedReason(findingDispositionsBlockedReason(failure));

      throw error;
    }
  }, [findingId, setActiveWaiver]);

  useEffect(() => {
    let canceled = false;

    setDispositionBaseline(EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE);

    void (async () => {
      try {
        await reload();
      } catch {
        if (!canceled) {
          setErrorMessage(
            buyerPolishedShell
              ? BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE
              : "Approval workflow data unavailable for this finding.",
          );
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [buyerPolishedShell, findingId, reload, setErrorMessage]);

  const handleDispositionSaved = useCallback(
    async (saved: FindingDispositionEvent, successMessage: string): Promise<void> => {
      const refreshed = await reload();
      const concurrentNotice = resolveDispositionConcurrentUpdateNotice(saved, refreshed);

      setDispositionLastSavedUtc(new Date().toISOString());
      setDispositionBaseline(captureDispositionBaseline());
      setStatusMessage(concurrentNotice ?? successMessage);
    },
    [reload],
  );

  const expectedCurrentDispositionRowVersionBase64 = useMemo(
    () =>
      resolveExpectedCurrentDispositionRowVersion({
        inspectPayloadRowVersionBase64: latestDispositionRowVersionBase64,
        latestHistoryEvent: history[0] ?? null,
        conflict: dispositionConflict,
      }),
    [dispositionConflict, history, latestDispositionRowVersionBase64],
  );

  const reloadDispositionConflict = useCallback(async (): Promise<void> => {
    await reload();
    setDispositionConflict(null);
  }, [reload]);

  const dismissDispositionConflict = useCallback((): void => {
    setDispositionConflict(null);
  }, []);

  useResumePendingLivelihoodMutation({
    enabled: canMutate,
    onReplayed: (_kind, result) => {
      void (async () => {
        try {
          await handleDispositionSaved(
            result as FindingDispositionEvent,
            "Disposition recorded after you signed back in.",
          );
        } catch (error: unknown) {
          const message = resolveMutationError(error);
          setDispositionInlineSaveError(message);
          setErrorMessage(message);
        }
      })();
    },
    onReplayError: (error: unknown) => {
      const message = resolveMutationError(error);
      setDispositionInlineSaveError(message);
      setErrorMessage(message);
    },
  });

  async function submitDisposition(): Promise<void> {
    if (!canMutate || busyAction !== null) {
      return;
    }

    setBusyAction("disposition");
    setErrorMessage(null);
    setStatusMessage(null);
    setDispositionInlineSaveError(null);

    try {
      const applyChangeAttestation = isFindingApplyChangeDisposition(disposition)
        ? buildFindingApplyChangeDispositionAttestation({
            isWorkingDesk,
            runId,
            findingId,
            overrideRecorded: applyChangePreviewOverride,
          })
        : null;

      const dispositionBody = {
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
        impactPreviewCompleted: applyChangeAttestation?.impactPreviewCompleted,
        previewOverrideReason: applyChangeAttestation?.previewOverrideReason,
        architectRestatement:
          architectRestatement.trim().length > 0 ? architectRestatement.trim() : undefined,
        ...(expectedCurrentDispositionRowVersionBase64 === undefined
          ? {}
          : { expectedCurrentDispositionRowVersionBase64 }),
      };
      const idempotencyKey = createGovernanceMutationIdempotencyKey();

      const saved = await recordFindingDispositionWith401Resume(findingId, dispositionBody, {
        idempotencyKey,
        returnPath: livelihoodReturnPath,
      });

      setDispositionConflict(null);
      await handleDispositionSaved(saved, "Disposition recorded.");
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const message =
        findingDispositionMutationBlockedReason(failure) ?? resolveMutationError(error);
      if (isLivelihoodMutation401RedirectError(error)) {
        return;
      }

      const conflict = readFindingDispositionConflictFromError(error);

      if (conflict !== null) {
        setDispositionConflict(conflict);
        setDispositionInlineSaveError(null);
        setErrorMessage(null);

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
      const applyChangeAttestation = buildFindingApplyChangeDispositionAttestation({
        isWorkingDesk,
        runId,
        findingId,
        overrideRecorded: applyChangePreviewOverride,
      });

      const dispositionBody = {
        disposition: "Remediated" as const,
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
        impactPreviewCompleted: applyChangeAttestation?.impactPreviewCompleted,
        previewOverrideReason: applyChangeAttestation?.previewOverrideReason,
        architectRestatement:
          architectRestatement.trim().length > 0 ? architectRestatement.trim() : undefined,
        ...(expectedCurrentDispositionRowVersionBase64 === undefined
          ? {}
          : { expectedCurrentDispositionRowVersionBase64 }),
      };
      const idempotencyKey = createGovernanceMutationIdempotencyKey();

      const saved = await recordFindingDispositionWith401Resume(findingId, dispositionBody, {
        idempotencyKey,
        returnPath: livelihoodReturnPath,
      });

      setDispositionConflict(null);
      await handleDispositionSaved(saved, "Finding marked as remediated.");
      setShowIncrementalRereviewLink(true);
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const message =
        findingDispositionMutationBlockedReason(failure) ?? resolveMutationError(error);
      if (isLivelihoodMutation401RedirectError(error)) {
        return;
      }

      const conflict = readFindingDispositionConflictFromError(error);

      if (conflict !== null) {
        setDispositionConflict(conflict);
        setDispositionInlineSaveError(null);
        setErrorMessage(null);

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
        isWorkingDesk,
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
    architectRestatement,
    setArchitectRestatement,
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
    dispositionBaseline,
    dispositionHistoryAsOfUtc,
    dispositionHistoryFailure,
    dispositionHistoryBlockedReason,
    refreshDispositionHistory: reload,
    expectedCurrentDispositionRowVersionBase64,
    dispositionConflict,
    reloadDispositionConflict,
    dismissDispositionConflict,
  };
}
