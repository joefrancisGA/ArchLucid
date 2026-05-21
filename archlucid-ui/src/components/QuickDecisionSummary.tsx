"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";

import { FindingAiReasoningDialog } from "@/components/FindingAiReasoningDialog";
import { FindingAskInlinePanel } from "@/components/FindingAskInlinePanel";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
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
  severityBadgeLabel,
  sortQuickDecisionFindings,
} from "@/lib/quick-decision-summary-derive";

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
};

/** Top severity-ranked actionable findings from run detail agent results (no extra API calls). */
export function QuickDecisionSummary(props: QuickDecisionSummaryProps): ReactElement {
  const router = useRouter();
  const canMutate = useOperateCapability();
  const sorted = sortQuickDecisionFindings(props.findings);
  const [showMuted, setShowMuted] = useState(false);
  const visibleFindings = showMuted ? sorted : sorted.filter((f) => !f.isMuted);
  const top = visibleFindings.slice(0, 3);
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
          ? " One monitored PHI minimization risk remains in the manifest—review severity and controls below."
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

  return (
    <>
      <Card
        data-testid="quick-decision-summary"
        className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30"
      >
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {buyerPolishedShell ? "Decision summary" : "Quick decision summary"}
            </CardTitle>
            {hasSourceFindings ? (
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
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-neutral-700 dark:text-neutral-300">
          {!hasSourceFindings ? (
            renderEmptySummary()
          ) : visibleFindings.length === 0 ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">
              All findings are currently muted. Enable <strong>Show muted findings</strong> to review them.
            </p>
          ) : (
            <ol className="m-0 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
              {top.map((f) => {
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

                return (
                  <li key={f.findingId} className="pl-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className={severityBadgeClass(f.severityValue)}>
                        <span className="sr-only">Severity </span>
                        {badgeLabel}
                      </span>
                      {f.confidenceLevel === "High" || f.confidenceLevel === "Medium" || f.confidenceLevel === "Low" ? (
                        <FindingConfidenceBadge level={f.confidenceLevel} />
                      ) : null}
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
                        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 text-xs" asChild>
                          <Link href={viewEvidenceHref} data-testid="quick-decision-view-evidence">
                            View evidence
                          </Link>
                        </Button>
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
                        Ask
                      </Button>
                      {f.iacStub !== null && f.iacStub !== undefined && f.iacStub.length > 0 ? (
                        <span className={`${badgeBase} border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100`}>
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
                    {askFindingId === f.findingId ? (
                      <div className="mt-3">
                        <FindingAskInlinePanel findingId={f.findingId} defaultOpen />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
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
