import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RunDetailAgentResult } from "@/types/authority";

import { cn } from "@/lib/utils";
import { runDetailSectionHeadingClass } from "@/app/(operator)/reviews/[runId]/_sections/run-detail-section-heading";

export type ReviewAgentExecutionLogSectionProps = {
  readonly results: readonly RunDetailAgentResult[] | null | undefined;
};

function confidenceLabel(confidence: number | string | null | undefined): string {
  if (confidence === null || confidence === undefined) return "—";

  const n = typeof confidence === "string" ? parseFloat(confidence) : confidence;

  if (!Number.isFinite(n)) return "—";

  return `${Math.round(n * 100)}%`;
}

function agentTypeLabel(agentType: RunDetailAgentResult["agentType"]): string {
  switch (agentType) {
    case 1:
      return "Topology";
    case 2:
      return "Cost";
    case 3:
      return "Compliance";
    case 4:
      return "Critic";
    default:
      return `Agent (${String(agentType)})`;
  }
}

/**
 * Collapsed execution log for each agent that ran in this review.
 * Architects reviewing AI-generated findings can inspect what ran, its
 * confidence, and whether it produced warnings or degradation.
 */
export function ReviewAgentExecutionLogSection({
  results,
}: ReviewAgentExecutionLogSectionProps): ReactElement | null {
  if (!results || results.length === 0) {
    return null;
  }

  const sorted = [...results].sort((a, b) => {
    const ta = a.createdUtc ?? "";
    const tb = b.createdUtc ?? "";

    return ta.localeCompare(tb);
  });

  return (
    <section id="agent-execution-log" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Agent execution log</h3>
        </CardHeader>
        <CardContent>
          <CollapsibleSection title={`${sorted.length} agent${sorted.length === 1 ? "" : "s"} ran`} defaultOpen={false}>
            <table className={cn("w-full", OPERATOR_TYPOGRAPHY.helper)}>
              <thead>
                <tr className={cn("border-b border-neutral-200 text-left font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  <th className="pb-1.5 pr-3 font-medium">Agent</th>
                  <th className="pb-1.5 pr-3 font-medium">Confidence</th>
                  <th className="pb-1.5 pr-3 font-medium">Findings</th>
                  <th className="pb-1.5 pr-3 font-medium">Evidence refs</th>
                  <th className="pb-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((result) => {
                  const hasDegradation =
                    typeof result.degradationReasonCode === "string" &&
                    result.degradationReasonCode.trim().length > 0;

                  return (
                    <tr
                      key={result.resultId}
                      className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                    >
                      <td className="py-1.5 pr-3 font-mono">{agentTypeLabel(result.agentType)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        {confidenceLabel(result.calibratedConfidence ?? result.confidence)}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{result.findings?.length ?? 0}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{result.evidenceRefs?.length ?? 0}</td>
                      <td className="py-1.5">
                        {hasDegradation ? (
                          <span
                            className={cn("inline-flex rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300", OPERATOR_TYPOGRAPHY.badge)}
                            title={result.degradationReasonCode ?? ""}
                          >
                            Degraded
                          </span>
                        ) : (
                          <span className={cn("inline-flex rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </section>
  );
}
