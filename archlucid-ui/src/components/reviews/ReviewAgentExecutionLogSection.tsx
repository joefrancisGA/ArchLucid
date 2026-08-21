"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import type { RunDetailAgentResult } from "@/types/authority";

import { runDetailSectionHeadingClass } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-section-heading";

export type ReviewAgentExecutionLogSectionProps = {
  readonly results: readonly RunDetailAgentResult[] | null | undefined;
};

function confidenceLabel(confidence: number | string | null | undefined): string {
  if (confidence === null || confidence === undefined) return " — ";

  const n = typeof confidence === "string" ? parseFloat(confidence) : confidence;

  if (!Number.isFinite(n)) return " — ";

  return `${Math.round(n * 100)}%`;
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
            <EnterpriseTable ariaLabel="Agent execution log" className={OPERATOR_TYPOGRAPHY.helper}>
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Agent</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Confidence</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Findings</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Evidence refs</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {sorted.map((result) => {
                  const hasDegradation =
                    typeof result.degradationReasonCode === "string" &&
                    result.degradationReasonCode.trim().length > 0;

                  return (
                    <EnterpriseTableRow key={result.resultId}>
                      <EnterpriseTableCell className="font-mono">{buyerLabelForAgentType(result.agentType)}</EnterpriseTableCell>
                      <EnterpriseTableCell className="tabular-nums">
                        {confidenceLabel(result.calibratedConfidence ?? result.confidence)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="tabular-nums">{result.findings?.length ?? 0}</EnterpriseTableCell>
                      <EnterpriseTableCell className="tabular-nums">{result.evidenceRefs?.length ?? 0}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {hasDegradation ? (
                          <span
                            className={cn("inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300", OPERATOR_TYPOGRAPHY.badge)}
                          >
                            Degraded
                            <FieldHelpTooltip
                              label="Degraded"
                              hint={result.degradationReasonCode ?? "Agent output degraded"}
                            />
                          </span>
                        ) : (
                          <span className={cn("inline-flex rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
                            OK
                          </span>
                        )}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </section>
  );
}
