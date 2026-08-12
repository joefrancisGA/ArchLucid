"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { SeverityTag } from "@/components/ui/severity-tag";
import { executeArchitectureRunAsync } from "@/lib/api";
import type { AgentQualityConcernRow } from "@/lib/agent-quality-warnings-presenter";
import { buildPlainLanguageQualityBlockSummary, QUALITY_GATE_REJECTION_RUNBOOK_PATH } from "@/lib/agent-quality-warnings-presenter";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";

export type RunAgentQualityWarningsPanelProps = {
  readonly runId: string;
  readonly rows: AgentQualityConcernRow[];
};

export function RunAgentQualityWarningsPanel(props: RunAgentQualityWarningsPanelProps): React.JSX.Element {
  const { runId, rows } = props;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  async function onReRunReview(): Promise<void> {
    setBusy(true);
    setError(null);

    try
    {
      await executeArchitectureRunAsync(runId);
      router.refresh();
    }
    catch (e: unknown)
    {
      if (isApiRequestError(e))
      {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      }
      else
      {
        setError({
          message: e instanceof Error ? e.message : "Re-run failed.",
          problem: null,
          correlationId: null,
        });
      }
    }
    finally
    {
      setBusy(false);
    }
  }

  const blockSummary = buildPlainLanguageQualityBlockSummary(rows);

  return (
    <section id="ai-quality-warnings" className="scroll-mt-24 mb-6" aria-label="AI quality warnings">
      <Card className="border-amber-600/35 dark:border-amber-700/45">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>AI Quality Warnings</h3>
            <StatusTag kind="needs-attention" label={`${rows.length} trace${rows.length === 1 ? "" : "s"}`} />
          </div>
          <CardDescription>
            Traces flagged by the post-execute quality gate. Review scores and thresholds, then re-run the review after
            adding evidence or context.
          </CardDescription>
          {blockSummary !== null ? (
            <p className={cn("m-0 mt-2 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} role="status">
              {blockSummary}{" "}
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={QUALITY_GATE_REJECTION_RUNBOOK_PATH}>
                Quality gate recovery runbook
              </Link>
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <EnterpriseTable ariaLabel="AI quality warning traces" className={OPERATOR_TYPOGRAPHY.body}>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Agent</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Structural</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Semantic</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell className="min-w-[12rem]">Threshold notes</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {rows.map((row) => (
                <EnterpriseTableRow key={row.traceId}>
                  <EnterpriseTableCell className="whitespace-nowrap">{row.agentLabel}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    {row.status === "rejected" ? (
                      <SeverityTag severity="Critical" kind="critical" label="Rejected" />
                    ) : (
                      <StatusTag kind="needs-attention" label="Warned" />
                    )}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                    {row.structuralCompletenessRatio.toFixed(2)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                    {row.semanticScore === null ? "—" : row.semanticScore.toFixed(2)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {row.breachedThresholds.join(" · ")}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="primary" size="sm" disabled={busy} onClick={() => void onReRunReview()}>
              {busy ? "Re-running review…" : "Re-run review"}
            </Button>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              Re-invokes agent execution for this review (same run id).
            </p>
          </div>

          {error !== null ? (
            <OperatorApiProblem
              problem={error.problem}
              fallbackMessage={error.message}
              correlationId={error.correlationId}
              variant="warning"
            />
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
