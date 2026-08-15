"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { CollabRecentActorPresenceStrip } from "@/components/CollabRecentActorPresenceStrip";
import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";
import { DispositionExportImpactNotice } from "@/components/operator/DispositionExportImpactNotice";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import {
  createRiskException,
  defaultRiskExceptionExpiresAtUtc,
  listFindingDispositions,
  listRiskExceptions,
  recordFindingDisposition,
  revokeRiskException,
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { upsertFindingRemediationAssignment } from "@/lib/api/finding-remediation-assignment-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import {
  createWaiverTransitionCopy,
  dispositionTransitionCopy,
  EVIDENCE_REFERENCE_HELP,
  EVIDENCE_REFERENCE_LABEL,
  EXCEPTION_OWNER_HELP,
  EXCEPTION_OWNER_LABEL,
  EXPIRATION_HELP,
  EXPIRATION_LABEL,
  markRemediatedTransitionCopy,
  remediationAssignmentTransitionCopy,
  REMEDIATION_OWNER_HELP,
  REMEDIATION_OWNER_LABEL,
  validateRemediationOwnerInput,
} from "@/lib/findings/finding-governance-action-copy";
import { buildSponsorStoryDispositionCountsFromRows } from "@/lib/sponsor-story-synopsis";
import { resolveDispositionConcurrentUpdateNotice } from "@/lib/findings/finding-disposition-concurrent-update";
import { collabRecentActorsFromDispositionHistory } from "@/lib/collab-recent-actor-presence";
import {
  canConfirmFindingApplyChange,
  FINDING_APPLY_CHANGE_PREVIEW_OVERRIDE_LABEL,
  FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE,
  findingApplyChangePreviewHref,
  isFindingApplyChangeDisposition,
} from "@/lib/findings/finding-apply-change-preview-gate";
import { incrementalRereviewAfterApplyHref } from "@/lib/review-quality/incremental-rereview-handoff";
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

const DISPOSITION_OPTIONS: FindingDispositionKind[] = [
  "Accepted",
  "Deferred",
  "NeedsEvidence",
  "Remediated",
  "RejectedAsNotApplicable",
];

type GovernanceBusyAction =
  | "remediation"
  | "disposition"
  | "mark-remediated"
  | "waiver"
  | "revoke-waiver"
  | null;

type PendingDispositionConfirm = "disposition" | "mark-remediated";

export type FindingInspectGovernanceStickinessPanelProps = {
  readonly findingId: string;
  readonly runId: string;
  readonly packageTitle?: string | null;
  readonly initialAssignedToUserId?: string | null;
  readonly initialRemediationDueUtc?: string | null;
  readonly recommendation?: string | null;
  readonly recommendedActions?: readonly string[];
  readonly approvedDecisionTitles?: readonly string[];
};

function latestDispositionLabel(history: readonly FindingDispositionEvent[]): string {
  if (history.length === 0) {
    return "No disposition recorded";
  }

  return history[0]?.disposition ?? "No disposition recorded";
}

/** TB-058/TB-059 operator workflow on the evidence trace page (governance action region). */
export function FindingInspectGovernanceStickinessPanel({
  findingId,
  runId,
  packageTitle = null,
  initialAssignedToUserId = null,
  initialRemediationDueUtc = null,
  recommendation = null,
  recommendedActions = [],
  approvedDecisionTitles = [],
}: FindingInspectGovernanceStickinessPanelProps) {
  const canMutate = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [history, setHistory] = useState<FindingDispositionEvent[]>([]);
  const [activeWaiver, setActiveWaiver] = useState<RiskExceptionRecord | null>(null);
  const [assignedToUserId, setAssignedToUserId] = useState(initialAssignedToUserId ?? "");
  const [remediationDueUtc, setRemediationDueUtc] = useState(
    initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "",
  );
  const [disposition, setDisposition] = useState<FindingDispositionKind>("Accepted");
  const [rationale, setRationale] = useState("");
  const [revisitDueUtc, setRevisitDueUtc] = useState("");
  const [evidenceRequestText, setEvidenceRequestText] = useState("");
  const [waiverRationale, setWaiverRationale] = useState("");
  const [waiverOwnerUserId, setWaiverOwnerUserId] = useState("");
  const [waiverExpiresAtUtc, setWaiverExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [waiverEvidenceRef, setWaiverEvidenceRef] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remediationOwnerError, setRemediationOwnerError] = useState<string | null>(null);
  const [waiverOwnerError, setWaiverOwnerError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<GovernanceBusyAction>(null);
  const [pendingDispositionConfirm, setPendingDispositionConfirm] = useState<PendingDispositionConfirm | null>(
    null,
  );
  const [pendingRevokeWaiverConfirm, setPendingRevokeWaiverConfirm] = useState(false);
  const [applyChangePreviewOverride, setApplyChangePreviewOverride] = useState(false);
  const [tradeOffAcknowledgment, setTradeOffAcknowledgment] = useState("");
  const [showIncrementalRereviewLink, setShowIncrementalRereviewLink] = useState(false);

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
  }, [findingId]);

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
              : "Governance workflow data unavailable for this finding.",
          );
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [buyerPolishedShell, reload]);

  useEffect(() => {
    setAssignedToUserId(initialAssignedToUserId ?? "");
    setRemediationDueUtc(initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "");
  }, [findingId, initialAssignedToUserId, initialRemediationDueUtc]);

  function resolveMutationError(error: unknown): string {
    const failure = toApiLoadFailure(error);

    if (buyerPolishedShell) {
      return "This governance action could not be saved right now. Your entries are preserved — try again in a moment.";
    }

    return failure.message;
  }

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

    try {
      await upsertFindingRemediationAssignment(findingId, {
        runId,
        assignedToUserId: assignedToUserId.trim().length > 0 ? assignedToUserId.trim() : null,
        remediationDueUtc:
          remediationDueUtc.trim().length > 0 ? new Date(remediationDueUtc).toISOString() : null,
      });
      setStatusMessage("Remediation assignment saved.");
    } catch (error) {
      setErrorMessage(resolveMutationError(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function submitDisposition(): Promise<void> {
    if (!canMutate || busyAction !== null) {
      return;
    }

    setBusyAction("disposition");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const saved = await recordFindingDisposition(findingId, {
        disposition,
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
        revisitDueUtc: disposition === "Deferred" && revisitDueUtc.trim().length > 0 ? revisitDueUtc : undefined,
        evidenceRequestText:
          disposition === "NeedsEvidence" && evidenceRequestText.trim().length > 0
            ? evidenceRequestText.trim()
            : undefined,
      });

      const refreshed = await reload();
      const concurrentNotice = resolveDispositionConcurrentUpdateNotice(saved, refreshed);

      setStatusMessage(concurrentNotice ?? "Disposition recorded.");
    } catch (error: unknown) {
      setErrorMessage(resolveMutationError(error));
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

    try {
      const saved = await recordFindingDisposition(findingId, {
        disposition: "Remediated",
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
      });

      const refreshed = await reload();
      const concurrentNotice = resolveDispositionConcurrentUpdateNotice(saved, refreshed);

      setStatusMessage(concurrentNotice ?? "Finding marked as remediated.");
      setShowIncrementalRereviewLink(true);
    } catch (error: unknown) {
      setErrorMessage(resolveMutationError(error));
    } finally {
      setBusyAction(null);
    }
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

  const currentDisposition = latestDispositionLabel(history);
  const mutationDisabledHintId = "finding-governance-stickiness-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
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

  return (
    <div className={cn(OPERATOR_LAYOUT.sectionStack, "rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40", OPERATOR_TYPOGRAPHY.body)}>
      <CollabRecentActorPresenceStrip recentActors={recentDispositionActors} />
      <WhyDisabledCtaHint
        id={mutationDisabledHintId}
        reason={mutationDisabledReason}
        testId={mutationDisabledHintId}
      />
      <SponsorStorySynopsisFromCounts
        packageTitle={sponsorSynopsisPackageTitle}
        counts={sponsorSynopsisCounts}
        sponsorHandoffHref={`/architecture/reviews/${encodeURIComponent(runId)}?reviewTab=review-package`}
      />
      {statusMessage ? (
        <p className="m-0 text-teal-800 dark:text-teal-300" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="m-0 text-red-700 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <section className="space-y-3" aria-labelledby="governance-remediation-heading">
        <h3 id="governance-remediation-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Remediation assignment
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {remediationAssignmentTransitionCopy()}
        </p>
        <label className="grid gap-1">
          <span className="font-medium">{REMEDIATION_OWNER_LABEL}</span>
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{REMEDIATION_OWNER_HELP}</span>
          <input
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={assignedToUserId}
            onChange={(event) => {
              setAssignedToUserId(event.target.value);
              setRemediationOwnerError(null);
            }}
            aria-invalid={remediationOwnerError !== null}
            aria-describedby={remediationOwnerError !== null ? "remediation-owner-error" : undefined}
            data-testid="finding-remediation-assignee"
          />
          {remediationOwnerError !== null ? (
            <span id="remediation-owner-error" className="text-red-700 dark:text-red-400" role="alert">
              {remediationOwnerError}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Remediation due (local)</span>
          <input
            type="datetime-local"
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={remediationDueUtc}
            onChange={(event) => setRemediationDueUtc(event.target.value)}
            data-testid="finding-remediation-due"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={busyAction !== null || !canMutate}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            onClick={() => void submitRemediationAssignment()}
            data-testid="finding-remediation-save"
            aria-busy={busyAction === "remediation"}
          >
            {busyAction === "remediation" ? "Saving remediation assignment…" : "Save remediation assignment"}
          </Button>
        </div>
      </section>

      <section className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800" aria-labelledby="governance-disposition-heading">
        <h3 id="governance-disposition-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Disposition
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Current state: <span className="font-medium text-al-text-primary">{currentDisposition}</span>
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {dispositionTransitionCopy(disposition)}
        </p>
        <label className="grid gap-1">
          <span className="font-medium">Proposed disposition</span>
          <select
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={disposition}
            onChange={(event) => setDisposition(event.target.value as FindingDispositionKind)}
          >
            {DISPOSITION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Rationale</span>
          {dispositionRequiresRationale(disposition) ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {DISPOSITION_RATIONALE_REQUIRED_MESSAGE}
            </span>
          ) : null}
          <textarea
            className="min-h-20 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
          />
        </label>
        {disposition === "Accepted" ? (
          <label className="grid gap-1">
            <span className="font-medium">Trade-off you accept</span>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {TRADE_OFF_ACKNOWLEDGMENT_REQUIRED_MESSAGE}
            </span>
            <textarea
              className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={tradeOffAcknowledgment}
              onChange={(event) => setTradeOffAcknowledgment(event.target.value)}
              data-testid="finding-disposition-trade-off-ack"
            />
          </label>
        ) : null}
        {disposition === "Deferred" ? (
          <label className="grid gap-1">
            <span className="font-medium">Revisit due (local)</span>
            <input
              type="datetime-local"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={revisitDueUtc}
              onChange={(event) => setRevisitDueUtc(event.target.value)}
            />
          </label>
        ) : null}
        {disposition === "NeedsEvidence" ? (
          <label className="grid gap-1">
            <span className="font-medium">Evidence request</span>
            <textarea
              className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={evidenceRequestText}
              onChange={(event) => setEvidenceRequestText(event.target.value)}
            />
          </label>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={busyAction !== null || !canMutate}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            onClick={() => {
              setPendingDispositionConfirm("disposition");
            }}
            data-testid="finding-disposition-save"
            aria-busy={busyAction === "disposition"}
          >
            {busyAction === "disposition" ? "Saving disposition…" : "Save disposition"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busyAction !== null || !canMutate}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            onClick={() => {
              setPendingDispositionConfirm("mark-remediated");
            }}
            data-testid="finding-mark-remediated"
            aria-busy={busyAction === "mark-remediated"}
          >
            {busyAction === "mark-remediated" ? "Marking finding as remediated…" : "Mark as remediated"}
          </Button>
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {markRemediatedTransitionCopy()}
        </p>
        {showIncrementalRereviewLink ? (
          <p className="m-0">
            <Link
              href={incrementalRereviewAfterApplyHref(runId, findingId)}
              className={OPERATOR_LINK.inline}
              data-testid="finding-incremental-rereview-link"
            >
              Run incremental re-review on the affected subgraph
            </Link>
          </p>
        ) : null}
      </section>

      <section className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800" aria-labelledby="governance-waiver-heading">
        <h3 id="governance-waiver-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Risk exception (waiver)
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {createWaiverTransitionCopy()}
        </p>
        {activeWaiver ? (
          <p className="m-0 text-neutral-700 dark:text-neutral-300">
            Active waiver expires {activeWaiver.expiresAtUtc} — owner {activeWaiver.ownerUserId}
          </p>
        ) : (
          <>
            <label className="grid gap-1">
              <span className="font-medium">{EXCEPTION_OWNER_LABEL}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{EXCEPTION_OWNER_HELP}</span>
              <input
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverOwnerUserId}
                onChange={(event) => {
                  setWaiverOwnerUserId(event.target.value);
                  setWaiverOwnerError(null);
                }}
                aria-invalid={waiverOwnerError !== null}
              />
              {waiverOwnerError !== null ? (
                <span className="text-red-700 dark:text-red-400" role="alert">
                  {waiverOwnerError}
                </span>
              ) : null}
            </label>
            <label className="grid gap-1">
              <span className="font-medium">Rationale</span>
              <textarea
                className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverRationale}
                onChange={(event) => setWaiverRationale(event.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="font-medium">{EVIDENCE_REFERENCE_LABEL}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{EVIDENCE_REFERENCE_HELP}</span>
              <input
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverEvidenceRef}
                onChange={(event) => setWaiverEvidenceRef(event.target.value)}
                placeholder="Artifact URI, ticket id, or audit correlation"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-medium">{EXPIRATION_LABEL}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{EXPIRATION_HELP}</span>
              <input
                type="datetime-local"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverExpiresAtUtc.slice(0, 16)}
                onChange={(event) => setWaiverExpiresAtUtc(new Date(event.target.value).toISOString())}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyAction !== null || !canMutate}
                aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                onClick={() => void submitWaiver()}
                data-testid="finding-waiver-create"
                aria-busy={busyAction === "waiver"}
              >
                {busyAction === "waiver" ? "Creating waiver…" : "Create waiver"}
              </Button>
            </div>
          </>
        )}
        {activeWaiver ? (
          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busyAction !== null || !canMutate}
              aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
              onClick={() => {
                setPendingRevokeWaiverConfirm(true);
              }}
              data-testid="finding-waiver-revoke"
              aria-busy={busyAction === "revoke-waiver"}
            >
              {busyAction === "revoke-waiver" ? "Revoking waiver…" : "Revoke waiver"}
            </Button>
          </div>
        ) : null}
      </section>

      {history.length > 0 ? (
        <section className="space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Disposition history</h3>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {history.map((event) => (
              <li key={event.eventId}>
                {event.disposition} — {event.occurredAtUtc}
                {event.rationale ? ` — ${event.rationale}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConfirmationDialog
        open={pendingDispositionConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDispositionConfirm(null);
            setApplyChangePreviewOverride(false);
          }
        }}
        title="Confirm finding disposition"
        description="Review export impact before recording this disposition on the audit trail."
        confirmLabel="Record disposition"
        variant="default"
        busy={busyAction === "disposition" || busyAction === "mark-remediated"}
        confirmDisabled={pendingDispositionBlockedReason !== null}
        extraContent={
          pendingDispositionConfirm !== null ? (
            <div className="mt-2 space-y-2">
              <DispositionExportBeforeAfterPreview disposition={pendingDispositionKind} />
              <DispositionExportImpactNotice disposition={pendingDispositionKind} />
              {pendingDispositionBlockedReason !== null ? (
                <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                  {pendingDispositionBlockedReason}
                </p>
              ) : null}
              {isFindingApplyChangeDisposition(pendingDispositionKind) ? (
                <div className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE}
                  </p>
                  <Link
                    href={findingApplyChangePreviewHref(runId, findingId)}
                    className={OPERATOR_LINK.inline}
                    data-testid="finding-apply-change-preview-link"
                  >
                    Open impact preview for this finding
                  </Link>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={applyChangePreviewOverride}
                      onChange={(event) => {
                        setApplyChangePreviewOverride(event.target.checked);
                      }}
                      data-testid="finding-apply-change-preview-override"
                    />
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {FINDING_APPLY_CHANGE_PREVIEW_OVERRIDE_LABEL}
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null
        }
        onConfirm={() => {
          if (pendingDispositionConfirm === "disposition") {
            void submitDisposition().finally(() => {
              setPendingDispositionConfirm(null);
            });

            return;
          }

          if (pendingDispositionConfirm === "mark-remediated") {
            void submitExplicitRemediation().finally(() => {
              setPendingDispositionConfirm(null);
            });
          }
        }}
      />

      <ConfirmationDialog
        open={pendingRevokeWaiverConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevokeWaiverConfirm(false);
          }
        }}
        title="Revoke risk exception?"
        description="Revoking ends the active waiver for this finding. The revocation is recorded on the audit trail; the sealed review record is not automatically changed."
        confirmLabel="Revoke waiver"
        variant="destructive"
        busy={busyAction === "revoke-waiver"}
        onConfirm={() => {
          void revokeWaiver().finally(() => {
            setPendingRevokeWaiverConfirm(false);
          });
        }}
      />
    </div>
  );
}
