import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/CollapsibleSection";
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

function shortList(items: readonly string[], limit: number): string {
  if (items.length === 0)
    return "-";

  const visible = items.slice(0, limit);
  const suffix = items.length > limit ? ` +${items.length - limit}` : "";

  return `${visible.join(", ")}${suffix}`;
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
          <div className="overflow-x-auto">
            <table className={cn("w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
              <thead>
                <tr className="border-b border-neutral-200 text-left dark:border-neutral-700">
                  <th className="px-1.5 py-2">Agent</th>
                  <th className="px-1.5 py-2">Corpus</th>
                  <th className="px-1.5 py-2">Chunks</th>
                  <th className="px-1.5 py-2">Documents</th>
                  <th className="px-1.5 py-2">Scores</th>
                  <th className="px-1.5 py-2">Coverage</th>
                  <th className="px-1.5 py-2">Tokens</th>
                  <th className="px-1.5 py-2">Graph-RAG</th>
                  <th className="px-1.5 py-2">Trace</th>
                  <th className="px-1.5 py-2">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.traceId} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="whitespace-nowrap px-1.5 py-2">{row.agentName?.trim() || "Unknown"}</td>
                    <td className="whitespace-nowrap px-1.5 py-2">{row.corpusKind?.trim() || "-"}</td>
                    <td className={cn("max-w-[14rem] px-1.5 py-2 font-mono", OPERATOR_TYPOGRAPHY.micro)} title={row.retrievedChunkIds.join(", ")}>
                      {shortList(row.retrievedChunkIds, 3)}
                    </td>
                    <td className={cn("max-w-[12rem] px-1.5 py-2 font-mono", OPERATOR_TYPOGRAPHY.micro)} title={row.documentIds.join(", ")}>
                      {row.documentMetadataMalformed ? "degraded" : shortList(row.documentIds, 2)}
                    </td>
                    <td className={cn("max-w-[12rem] px-1.5 py-2 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scoreText(row)}</td>
                    <td className="whitespace-nowrap px-1.5 py-2">{pct(row.citationCoverage)}</td>
                    <td className="whitespace-nowrap px-1.5 py-2">
                      {optionalNumber(row.tokensIn)} in / {optionalNumber(row.tokensOut)} out
                    </td>
                    <td className={cn("whitespace-nowrap px-1.5 py-2", OPERATOR_TYPOGRAPHY.helper)}>{graphRagSummary(row)}</td>
                    <td className={cn("max-w-[12rem] truncate px-1.5 py-2 font-mono", OPERATOR_TYPOGRAPHY.micro)} title={row.traceId}>
                      {row.agentExecutionTraceId?.trim() || row.traceId}
                    </td>
                    <td className={cn("whitespace-nowrap px-1.5 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      {formatInstantForLocale(row.createdUtc)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CollapsibleSection>
    </div>
  );
}
