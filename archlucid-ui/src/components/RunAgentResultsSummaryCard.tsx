"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunDetailAgentResult, RunRetrievalGroundingSummary } from "@/types/authority";

function agentTypeLabel(agentType: RunDetailAgentResult["agentType"]): string {
  switch (agentType) {
    case "Topology":
      return "Topology";
    case "Cost":
      return "Cost";
    case "Compliance":
      return "Compliance";
    case "Critic":
      return "Critic";
    default:
      return `Agent (${String(agentType)})`;
  }
}

function countArray(value: readonly unknown[] | null | undefined): number {
  return Array.isArray(value) ? value.length : 0;
}

function topologyExemplarLink(summary: RunRetrievalGroundingSummary | null | undefined): ReactElement | null {
  if (summary === null || summary === undefined)
    return null;

  const missing = summary.topologyReferenceArchitectureExemplarMissing === true;
  const count = summary.topologyReferenceArchitectureExemplarCount ?? 0;

  if (!missing && count === 0)
    return null;

  return (
    <p className="m-0 mt-1">
      <a className="font-medium underline underline-offset-2" href="#run-retrieval-exemplar-style-prior">
        {missing
          ? "No reference architecture exemplar matched — open retrieval grounding"
          : `${count} reference architecture exemplar chunk${count === 1 ? "" : "s"} used as style prior`}
      </a>
    </p>
  );
}

/** Summarizes architecture pipeline agent results on the operator run detail page (TB-106). */
export function RunAgentResultsSummaryCard(props: {
  readonly results: readonly RunDetailAgentResult[] | null | undefined;
  readonly retrievalGroundingSummary?: RunRetrievalGroundingSummary | null;
}): ReactElement | null {
  const rows = props.results?.filter((row) => row !== null && row !== undefined) ?? [];

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card
      className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30"
      data-testid="run-agent-results-summary-card"
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Agent results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <ul className="m-0 list-none space-y-2 p-0">
          {rows.map((result) => {
            const claims = countArray(result.claims);
            const findings = countArray(result.findings);
            const evidenceRefs = countArray(result.evidenceRefs);
            const confidence =
              typeof result.confidence === "number" && Number.isFinite(result.confidence)
                ? result.confidence.toFixed(2)
                : null;

            return (
              <li
                key={result.resultId}
                className={cn("rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}
                data-testid={`run-agent-result-row-${result.resultId}`}
              >
                <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                  {agentTypeLabel(result.agentType)}
                </p>
                <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">
                  {claims} claim{claims === 1 ? "" : "s"}
                  {" · "}
                  {findings} finding{findings === 1 ? "" : "s"}
                  {" · "}
                  {evidenceRefs} evidence ref{evidenceRefs === 1 ? "" : "s"}
                  {confidence !== null ? ` · confidence ${confidence}` : null}
                </p>
                {result.agentType === "Topology"
                  ? topologyExemplarLink(props.retrievalGroundingSummary)
                  : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
