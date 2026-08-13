import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type {
  RunRetrievalGroundingPayload,
  RunRetrievalGroundingRow,
} from "@/types/agent-forensics";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";

type RunRetrievalGroundingPanelProps = {
  payload: RunRetrievalGroundingPayload | null;
  failure: ApiLoadFailureState | null;
  sectionId?: string;
  title?: string;
};

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function optionalNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return "-";

  return String(value);
}

function graphRagSummary(row: RunRetrievalGroundingRow): string {
  const neighbors = row.graphRagNeighborsAdded;
  const seeds = row.graphRagSeedHits;
  const latency = row.graphRagExpansionLatencyMs;

  if ((neighbors === null || neighbors === undefined || neighbors === 0)
    && (seeds === null || seeds === undefined || seeds === 0)
    && (latency === null || latency === undefined))
    return "-";

  const parts: string[] = [];

  if (typeof neighbors === "number")
    parts.push(`${neighbors} nbr`);

  if (typeof seeds === "number" && seeds > 0)
    parts.push(`${seeds} seed`);

  if (typeof latency === "number" && !Number.isNaN(latency))
    parts.push(`${Math.round(latency)} ms`);

  return parts.length > 0 ? parts.join(" · ") : "-";
}

function scoreText(row: RunRetrievalGroundingRow): string {
  if (row.scoreMetadataMalformed)
    return "degraded";

  if (row.scoreSummaries.length === 0)
    return "-";

  return row.scoreSummaries
    .slice(0, 2)
    .map((score) => {
      if (score.score === null || score.score === undefined || Number.isNaN(score.score))
        return score.chunkId;

      return `${score.chunkId}: ${score.score.toFixed(4)}`;
    })
    .join(", ");
}

/** Redaction-safe forensic panel: chunk ids and metadata only, never raw prompt or retrieved text. */
export function RunRetrievalGroundingPanel(props: RunRetrievalGroundingPanelProps) {
  const { payload, failure } = props;
  const sectionId = props.sectionId ?? "retrieval-grounding";
  const sectionTitle = props.title ?? "Retrieval grounding (diagnostics)";
  const rows = payload?.rows ?? [];
  const degraded = payload?.hasDegradedMetadata === true || rows.some((r) => r.scoreMetadataMalformed || r.documentMetadataMalformed);

  return (
    <div id={sectionId} className="scroll-mt-24">
      <CollapsibleSection title={sectionTitle} defaultOpen={false}>
        <p className={cn("mt-0 max-w-3xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Retrieval traces show which chunks each agent retrieved, the corpus kind, citation coverage, and token counts.
          Raw prompts and retrieved content stay redacted at this edge.
        </p>

        {failure ? (
          <>
            <p className={cn("mb-2 font-semibold", OPERATOR_TYPOGRAPHY.body)}>Retrieval grounding could not be loaded.</p>
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
              variant="warning"
            />
          </>
        ) : null}

        {!failure && rows.length === 0 ? (
          <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            No retrieval grounding recorded for this review. This is expected for simulator-only reviews or agents that did not
            use retrieval.
          </p>
        ) : null}

        {!failure && degraded ? (
          <div
            role="status"
            className={cn(
              "mb-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2.5 text-al-text-primary dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            Some persisted retrieval metadata could not be parsed. Chunk ids and coverage remain available where recorded.
          </div>
        ) : null}

        {!failure && rows.length > 0 ? (
          <EnterpriseTable ariaLabel="Retrieval grounding traces" className={OPERATOR_TYPOGRAPHY.body}>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Agent</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Corpus</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Chunks</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Documents</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Scores</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Coverage</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Tokens</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Graph-RAG</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Trace</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Recorded</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {rows.map((row) => (
                <EnterpriseTableRow key={row.traceId}>
                  <EnterpriseTableCell className="whitespace-nowrap">{row.agentName?.trim() || "Unknown"}</EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">{row.corpusKind?.trim() || "-"}</EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[14rem] break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {row.retrievedChunkIds.length > 0 ? row.retrievedChunkIds.join(", ") : "-"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[12rem] break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {row.documentMetadataMalformed ? "degraded" : row.documentIds.length > 0 ? row.documentIds.join(", ") : "-"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[12rem] font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scoreText(row)}</EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">{pct(row.citationCoverage)}</EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">
                    {optionalNumber(row.tokensIn)} in / {optionalNumber(row.tokensOut)} out
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("whitespace-nowrap", OPERATOR_TYPOGRAPHY.helper)}>{graphRagSummary(row)}</EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[12rem] break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {row.agentExecutionTraceId?.trim() || row.traceId}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("whitespace-nowrap text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {formatInstantForLocale(row.createdUtc)}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : null}
      </CollapsibleSection>
    </div>
  );
}
