"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactElement } from "react";

import { FindingAiReasoningDialog } from "@/components/FindingAiReasoningDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const sorted = sortQuickDecisionFindings(props.findings);
  const top = sorted.slice(0, 3);
  const hasFindings = props.findings.length > 0;
  const buyerPolishedShell = props.buyerPolishedShell === true;
  const headlineFindingCount = props.headlineFindingCount;
  const headlineWarningCount = props.headlineWarningCount;
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [activeReasoning, setActiveReasoning] = useState<QuickDecisionFinding | null>(null);

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
          ? " One monitored warning remains in the manifest—review severity and controls below."
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
          <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Quick decision summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-neutral-700 dark:text-neutral-300">
          {!hasFindings ? (
            renderEmptySummary()
          ) : (
            <ol className="m-0 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
              {top.map((f) => {
                const href = `/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(f.findingId)}`;
                const snippet =
                  f.recommendation.length > 0
                    ? firstRecommendationSentence(f.recommendation)
                    : "See finding detail for recommended actions.";
                const badgeLabel = severityBadgeLabel(f.severityValue);

                return (
                  <li key={f.findingId} className="pl-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className={severityBadgeClass(f.severityValue)}>
                        <span className="sr-only">Severity </span>
                        {badgeLabel}
                      </span>
                      <Link href={href} className="min-w-0 flex-1 font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100">
                        <span className="sr-only">Finding {f.findingId}: </span>
                        {f.title}
                      </Link>
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
                    </div>
                    {snippet.length > 0 ? (
                      <p className="m-0 mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{snippet}</p>
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
    </>
  );
}
