"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";

import { FindingAiReasoningDialog } from "@/components/FindingAiReasoningDialog";
import { FindingPolicyCitationProminentStrip } from "@/components/findings/FindingPolicyCitationProminentStrip";
import { FindingsItsmExportToolbar } from "@/components/FindingsItsmExportToolbar";
import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { FindingAskInlinePanel } from "@/components/FindingAskInlinePanel";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { FindingTrustChip } from "@/components/FindingTrustChip";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { FindingEvidenceRefSnippets } from "@/components/usability/FindingEvidenceRefSnippets";
import { FindingPolicyEvidenceCitationLinks } from "@/components/findings/FindingPolicyEvidenceCitationLinks";
import { ReviewDetailPolicyPackFindingsBreakdown } from "@/components/findings/ReviewDetailPolicyPackFindingsBreakdown";
import { FindingInsightDensityDisclosure } from "@/components/usability/FindingInsightDensityDisclosure";
import { FindingFeedbackThumbs } from "@/components/FindingFeedbackThumbs";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { postFindingMute } from "@/lib/api";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  firstRecommendationSentence,
  partitionQuickDecisionFindings,
  severityBadgeLabel,
  sortQuickDecisionFindings,
} from "@/lib/quick-decision-summary-derive";
import { findingEnforcementTierLabel } from "@/lib/finding-enforcement-tier";
import { buildFindingPolicyEvidenceCitationsFromQuickDecision } from "@/lib/finding-policy-evidence-citations";
import {
  groupQuickDecisionFindingsByPolicyPack,
  summarizePolicyPackFindingImpact,
} from "@/lib/group-findings-by-policy-pack";
import {
  formatHiddenLowConfidenceHint,
  partitionQuickDecisionFindingsByConfidence,
} from "@/lib/finding-confidence-filter";
import { cn } from "@/lib/utils";

const badgeBase =
  "inline-flex shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums";

function severityBadgeClass(severityValue: number): string {
  if (severityValue >= 3) {
    return `${badgeBase} border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100`;
  }

  if (severityValue === 2) {
    return `${badgeBase} border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-50`;
  }

  if (severityValue === 1) {
    return `${badgeBase} border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50`;
  }

  return `${badgeBase} border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200`;
}

export type QuickDecisionSummaryProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  /** When true and headline counts disagree with extracted findings, show a finalized-review-safe narrative (buyer shell). */
  readonly buyerPolishedShell?: boolean;
  readonly headlineFindingCount?: number | null;
  readonly headlineWarningCount?: number | null;
  /** When true, rows were derived from explanation traces because agent results were empty on the authority payload. */
  readonly usingExplanationFallback?: boolean;
  readonly manifestRuleSetId?: string | null;
  readonly manifestRuleSetVersion?: string | null;
};

/** Top severity-ranked actionable findings from run detail agent results (no extra API calls). */
export function QuickDecisionSummary(props: QuickDecisionSummaryProps): ReactElement {
  const router = useRouter();
  const canMutate = useOperateCapability();
  const sorted = sortQuickDecisionFindings(props.findings);
  const [showMuted, setShowMuted] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const afterMuteFilter = showMuted ? sorted : sorted.filter((f) => !f.isMuted);
  const { trustedFindings, lowConfidenceFindings } = partitionQuickDecisionFindingsByConfidence(afterMuteFilter);
  const hiddenLowConfidenceCount = showLowConfidence ? 0 : lowConfidenceFindings.length;
  const hiddenLowConfidenceHint = formatHiddenLowConfidenceHint(hiddenLowConfidenceCount);
  const { policyViolations, advisoryNotes } = partitionQuickDecisionFindings(trustedFindings);
  const {
    policyViolations: lowConfidencePolicyViolations,
    advisoryNotes: lowConfidenceAdvisoryNotes,
  } = partitionQuickDecisionFindings(lowConfidenceFindings);
  const topGroups = groupQuickDecisionFindingsByPolicyPack(
    policyViolations,
    props.manifestRuleSetId,
    props.manifestRuleSetVersion,
  );
  const policyPackImpact = summarizePolicyPackFindingImpact(
    afterMuteFilter,
    props.manifestRuleSetId,
    props.manifestRuleSetVersion,
  );
  const policyPackSummary = policyPackImpact.groups;
  const hasSourceFindings = props.findings.length > 0;
  const buyerPolishedShell = props.buyerPolishedShell === true;
  const headlineFindingCount = props.headlineFindingCount;
  const headlineWarningCount = props.headlineWarningCount;
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [activeReasoning, setActiveReasoning] = useState<QuickDecisionFinding | null>(null);
  const [muteOpen, setMuteOpen] = useState(false);
  const [muteTarget, setMuteTarget] = useState<QuickDecisionFinding | null>(null);
  const [muteReason, setMuteReason] = useState("");
  const [muteBusy, setMuteBusy] = useState(false);
  const [muteError, setMuteError] = useState<string | null>(null);
  const [askFindingId, setAskFindingId] = useState<string | null>(null);

  function renderEmptySummary(): ReactElement {
    if (
      buyerPolishedShell &&
      typeof headlineFindingCount === "number" &&
      Number.isFinite(headlineFindingCount) &&
      Math.trunc(headlineFindingCount) > 0
    ) {
      const n = Math.trunc(headlineFindingCount);
      const warningN =
        typeof headlineWarningCount === "number" && Number.isFinite(headlineWarningCount)
          ? Math.trunc(headlineWarningCount)
          : 0;

      const warningPhrase =
        warningN > 0
          ? " One monitored PHI minimization risk remains in this review record—review severity and controls below."
          : "";

      return (
        <p className="m-0 text-neutral-600 dark:text-neutral-400">
          {`This finalized review records ${n} finding${n === 1 ? "" : "s"} with no unresolved blocking issues.`}
          {warningPhrase}
        </p>
      );
    }

    return <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings to act on</p>;
  }

  function renderFindingRow(f: QuickDecisionFinding, showTierBadge: boolean, subdued = false): ReactElement {
    const href = `/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(f.findingId)}`;
    const snippet =
      f.recommendation.length > 0
        ? firstRecommendationSentence(f.recommendation)
        : "See finding detail for recommended actions.";
    const badgeLabel = severityBadgeLabel(f.severityValue);
    const graphFocusId = preferredGraphNodeIdForFindingDeepLink(props.runId, f.findingId);
    const evidenceRefCount = f.evidenceRefCount ?? 0;
    const viewEvidenceHref =
      evidenceRefCount > 0 || graphFocusId !== null
        ? graphTrailHrefWithOptionalNode(props.runId, graphFocusId)
        : null;
    const citationModel = buildFindingPolicyEvidenceCitationsFromQuickDecision(props.runId, f);

    return (
      <li
        key={f.findingId}
        className={cn("pl-1", subdued ? "opacity-80" : undefined)}
        data-testid={subdued ? `quick-decision-low-confidence-${f.findingId}` : undefined}
      >
        {citationModel.pack !== null || citationModel.policy !== null ? (
          <FindingPolicyCitationProminentStrip
            pack={citationModel.pack}
            policy={citationModel.policy}
            compact
            className="mb-2"
          />
        ) : null}
        <div className="flex flex-wrap items-start gap-2">
          <span className={severityBadgeClass(f.severityValue)}>
            <span className="sr-only">Severity </span>
            {badgeLabel}
          </span>
          {showTierBadge ? (
            <span
              className={`${badgeBase} border-neutral-300 bg-neutral-50 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200`}
            >
              {findingEnforcementTierLabel(f.enforcementTier)}
            </span>
          ) : null}
          {f.confidenceLevel === "High" || f.confidenceLevel === "Medium" || f.confidenceLevel === "Low" ? (
            <FindingConfidenceBadge level={f.confidenceLevel} />
          ) : null}
          <FindingTrustChip finding={f} />
          {f.isMuted ? (
            <span className={`${badgeBase} border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200`}>
              Muted
            </span>
          ) : null}
          <Link
            href={href}
            className="min-w-0 flex-1 font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
          >
            <span className="sr-only">Finding {f.findingId}: </span>
            {f.title}
          </Link>
          {viewEvidenceHref !== null ? (
            <FindingEvidenceLinkChip
              href={viewEvidenceHref}
              evidenceRefCount={evidenceRefCount}
              className="shrink-0"
            />
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 shrink-0 text-xs"
            onClick={() => {
              setActiveReasoning(f);
              setReasoningOpen(true);
            }}
          >
            View AI reasoning
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 shrink-0 text-xs"
            onClick={() => {
              setAskFindingId((current) => (current === f.findingId ? null : f.findingId));
            }}
            aria-pressed={askFindingId === f.findingId}
            title="Ask about this finding"
          >
            <MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
            Ask
          </Button>
          {f.iacStub !== null && f.iacStub !== undefined && f.iacStub.length > 0 ? (
            <span className={`${badgeBase} border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700`}>
              Bicep stub
            </span>
          ) : null}
          {canMutate && !f.isMuted ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 shrink-0 text-xs"
              title="Hide this finding from the default list for this review"
              onClick={() => {
                setMuteTarget(f);
                setMuteReason("");
                setMuteError(null);
                setMuteOpen(true);
              }}
            >
              Mute
            </Button>
          ) : null}
          {canMutate ? (
            <FindingFeedbackThumbs runId={props.runId} findingId={f.findingId} compact />
          ) : null}
        </div>
        {f.traceConfidenceLabel !== null &&
        f.traceConfidenceLabel !== undefined &&
        f.traceConfidenceLabel.trim().length > 0 ? (
          <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Evaluation trace: {f.traceConfidenceLabel}
          </p>
        ) : null}
        {f.evaluationConfidenceScore !== null &&
        f.evaluationConfidenceScore !== undefined &&
        Number.isFinite(f.evaluationConfidenceScore) &&
        (f.confidenceLevel !== "High" &&
          f.confidenceLevel !== "Medium" &&
          f.confidenceLevel !== "Low") ? (
          <p className="m-0 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Evaluation score {Math.round(f.evaluationConfidenceScore)}
          </p>
        ) : null}
        {snippet.length > 0 ? (
          <p className="m-0 mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{snippet}</p>
        ) : null}
        <FindingPolicyEvidenceCitationLinks model={citationModel} compact className="mt-2" />
        {f.evidenceRefSnippets !== undefined && f.evidenceRefSnippets.length > 0 ? (
          <FindingEvidenceRefSnippets snippets={f.evidenceRefSnippets} />
        ) : null}
        {(f.insightDensityScore !== null && f.insightDensityScore !== undefined) ||
        (f.whyThisIsNotGeneric !== null && f.whyThisIsNotGeneric !== undefined && f.whyThisIsNotGeneric.length > 0) ? (
          <FindingInsightDensityDisclosure
            insightDensityScore={f.insightDensityScore ?? null}
            whyThisIsNotGeneric={f.whyThisIsNotGeneric ?? null}
            className="mt-2"
          />
        ) : null}
        <div
          className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800"
          data-testid={`finding-itsm-sync-${f.findingId}`}
        >
          <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
            Jira / ServiceNow
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CopyGovernanceQueueWorkItemButton
              runId={props.runId}
              findingId={f.findingId}
              findingTitle={f.title}
              severityLabel={
                f.severityValue >= 3 ? "High" : f.severityValue === 2 ? "Medium" : f.severityValue === 1 ? "Low" : "Info"
              }
              recommendedAction={f.recommendation}
              statusLabel="Open"
              compact
            />
            <ItsmOutboundQuickActions findingId={f.findingId} compact />
          </div>
        </div>
        {askFindingId === f.findingId ? (
          <div className="mt-3">
            <FindingAskInlinePanel findingId={f.findingId} defaultOpen />
          </div>
        ) : null}
      </li>
    );
  }

  return (
    <>
      <Card
        data-testid="quick-decision-summary"
        className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30"
      >
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold text-al-text-primary">
                {buyerPolishedShell ? "Decision summary" : "Quick decision summary"}
              </CardTitle>
              {hasSourceFindings ? (
                <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                  Export CSV or JSON above, or use <strong>Copy for Jira</strong> on each finding for one-click ticket paste.
                  {hiddenLowConfidenceHint !== null ? (
                    <span className="mt-1 block" data-testid="quick-decision-low-confidence-hidden-hint">
                      {hiddenLowConfidenceHint}.
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            {hasSourceFindings ? (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                    checked={showLowConfidence}
                    onChange={(e) => {
                      setShowLowConfidence(e.target.checked);
                    }}
                    data-testid="quick-decision-show-low-confidence"
                  />
                  Show low-confidence findings
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                    checked={showMuted}
                    onChange={(e) => {
                      setShowMuted(e.target.checked);
                    }}
                  />
                  Show muted findings
                </label>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-neutral-700 dark:text-neutral-300">
          {hasSourceFindings ? (
            <FindingsItsmExportToolbar runId={props.runId} findings={props.findings} />
          ) : null}
          {hasSourceFindings && policyPackSummary.length > 0 ? (
            <ReviewDetailPolicyPackFindingsBreakdown
              groups={policyPackSummary}
              manifestRuleSetId={props.manifestRuleSetId}
              mappedFindingCount={policyPackImpact.mappedFindingCount}
              unmappedFindingCount={policyPackImpact.unmappedFindingCount}
            />
          ) : null}
          {props.usingExplanationFallback === true ? (
            <p
              className="m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              data-testid="quick-decision-explanation-fallback-notice"
              role="status"
            >
              Confidence rows are derived from the aggregate explanation trace because per-finding agent results were not
              on this review payload. Re-run execute or refresh after commit if you need agent-result grounding.
            </p>
          ) : null}
          {!hasSourceFindings ? (
            renderEmptySummary()
          ) : afterMuteFilter.length === 0 ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">
              All findings are currently muted. Enable <strong>Show muted findings</strong> to review them.
            </p>
          ) : trustedFindings.length === 0 && lowConfidenceFindings.length > 0 && !showLowConfidence ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400" data-testid="quick-decision-low-confidence-only">
              Low-confidence findings are hidden to reduce noise. Enable <strong>Show low-confidence findings</strong>{" "}
              to review unverified items.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                  Policy violations
                </h3>
                {policyViolations.length === 0 ? (
                  <p className="m-0 text-neutral-600 dark:text-neutral-400">
                    No governance-blocking findings on this review. Baseline guidance may still appear under advisory notes.
                  </p>
                ) : (
                  <div className="space-y-4" data-testid="quick-decision-policy-violations">
                    {topGroups.map((group) => (
                      <div key={group.groupKey}>
                        <h4 className="m-0 mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          {group.packDisplayName}
                          <span className="ml-1 font-normal text-neutral-500 dark:text-neutral-400">
                            ({group.findingCount})
                          </span>
                        </h4>
                        <ol className="m-0 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                          {group.findings.slice(0, 3).map((f) => renderFindingRow(f, false))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {advisoryNotes.length > 0 ? (
                <div
                  className="rounded-md border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/30"
                  data-testid="quick-decision-advisory-notes"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                        Advisory notes
                      </h3>
                      <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                        Opt-in baseline guidance from enabled policy packs. These do not block commit.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAdvisory((current) => !current);
                      }}
                      aria-expanded={showAdvisory}
                    >
                      {showAdvisory ? "Hide advisory notes" : `Show ${advisoryNotes.length} advisory note${advisoryNotes.length === 1 ? "" : "s"}`}
                    </Button>
                  </div>
                  {showAdvisory ? (
                    <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                      {advisoryNotes.map((f) => renderFindingRow(f, true))}
                    </ol>
                  ) : null}
                </div>
              ) : null}

              {showLowConfidence && lowConfidenceFindings.length > 0 ? (
                <div
                  className="rounded-md border border-dashed border-neutral-300 bg-neutral-50/50 p-3 dark:border-neutral-600 dark:bg-neutral-900/20"
                  data-testid="quick-decision-low-confidence-section"
                >
                  <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                    Unverified / low confidence
                  </h3>
                  <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    These findings had low evaluation confidence or ambiguous evidence. Verify before acting.
                  </p>
                  {lowConfidencePolicyViolations.length > 0 ? (
                    <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                      {lowConfidencePolicyViolations.map((f) => renderFindingRow(f, false, true))}
                    </ol>
                  ) : null}
                  {lowConfidenceAdvisoryNotes.length > 0 ? (
                    <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                      {lowConfidenceAdvisoryNotes.map((f) => renderFindingRow(f, true, true))}
                    </ol>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <FindingAiReasoningDialog
        open={reasoningOpen}
        onOpenChange={(open) => {
          setReasoningOpen(open);

          if (!open) {
            setActiveReasoning(null);
          }
        }}
        findingId={activeReasoning?.findingId ?? null}
        findingTitle={activeReasoning?.title ?? ""}
        snapshot={activeReasoning?.aiReasoning ?? null}
      />

      <Dialog
        open={muteOpen}
        onOpenChange={(open) => {
          setMuteOpen(open);

          if (!open) {
            setMuteTarget(null);
            setMuteReason("");
            setMuteError(null);
            setMuteBusy(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mute finding</DialogTitle>
            <DialogDescription>
              Provide a short reason. Muted findings are hidden from this summary until you enable{" "}
              <strong>Show muted findings</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="finding-mute-reason">Reason</Label>
            <Textarea
              id="finding-mute-reason"
              value={muteReason}
              onChange={(e) => {
                setMuteReason(e.target.value);
              }}
              rows={4}
              className="resize-y"
              disabled={muteBusy}
            />
            {muteError ? <p className="m-0 text-sm text-rose-700 dark:text-rose-300">{muteError}</p> : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMuteOpen(false);
              }}
              disabled={muteBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={muteBusy || muteReason.trim().length === 0}
              onClick={() => {
                if (muteTarget === null) {
                  return;
                }

                void (async () => {
                  setMuteBusy(true);
                  setMuteError(null);

                  try {
                    await postFindingMute(props.runId, muteTarget.findingId, muteReason.trim());
                    setMuteOpen(false);
                    router.refresh();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Mute request failed.";
                    setMuteError(msg);
                  } finally {
                    setMuteBusy(false);
                  }
                })();
              }}
            >
              {muteBusy ? "Saving…" : "Mute finding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
