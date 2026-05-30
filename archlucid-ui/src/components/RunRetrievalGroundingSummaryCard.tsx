import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

function dispositionClass(disposition: string): string {
  switch (disposition.toUpperCase()) {
    case "PASS":
      return "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100";
    case "WARN":
      return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100";
    case "HOLD":
      return "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950/30 dark:text-neutral-100";
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Operator rollup of persisted retrieval grounding traces on run detail (assessment #5). */
export function RunRetrievalGroundingSummaryCard(props: {
  readonly summary: RunRetrievalGroundingSummary | null | undefined;
  readonly runId: string;
}): ReactElement | null {
  const summary = props.summary;

  if (summary === null || summary === undefined)
    return null;

  const disposition = (summary.disposition ?? "WARN").toUpperCase();
  const agentsWithTraces = summary.agentsWithTraces ?? [];
  const missingAgents = summary.expectedAgentsMissingTraces ?? [];

  return (
    <Card className={`rounded-lg border shadow-sm ${dispositionClass(disposition)}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Retrieval grounding — {disposition}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        <dl className="m-0 grid gap-1 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-4">
          <dt>Trace rows</dt>
          <dd className="m-0 tabular-nums sm:justify-self-end">{summary.traceCount ?? 0}</dd>
          <dt>Retrieved chunks</dt>
          <dd className="m-0 tabular-nums sm:justify-self-end">{summary.totalRetrievedChunks ?? 0}</dd>
          <dt>Avg citation coverage</dt>
          <dd className="m-0 tabular-nums sm:justify-self-end">
            {formatPercent(typeof summary.averageCitationCoverage === "number" ? summary.averageCitationCoverage : 0)}
          </dd>
        </dl>

        {agentsWithTraces.length > 0 ? (
          <p className="m-0">
            <span className="font-medium">Agents with traces:</span> {agentsWithTraces.join(", ")}
          </p>
        ) : null}

        {missingAgents.length > 0 ? (
          <p className="m-0 font-medium">
            Missing traces: {missingAgents.join(", ")}
          </p>
        ) : null}

        {typeof summary.operatorDetail === "string" && summary.operatorDetail.length > 0 ? (
          <p className="m-0">{summary.operatorDetail}</p>
        ) : null}

        <p className="m-0">
          <a
            className="font-medium underline underline-offset-2"
            href={`/api/proxy/v1/authority/runs/${encodeURIComponent(props.runId)}/retrieval-grounding`}
          >
            Open full retrieval-grounding JSON
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
