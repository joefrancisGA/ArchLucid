import { CollapsibleSection } from "@/components/CollapsibleSection";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type {
  RunRetrievalGroundingPayload,
  RunRetrievalGroundingRow,
} from "@/types/agent-forensics";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";

type RunRetrievalGroundingPanelProps = {
  payload: RunRetrievalGroundingPayload | null;
  failure: ApiLoadFailureState | null;
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
  const rows = payload?.rows ?? [];
  const degraded = payload?.hasDegradedMetadata === true || rows.some((r) => r.scoreMetadataMalformed || r.documentMetadataMalformed);

  return (
    <div id="retrieval-grounding" className="scroll-mt-24">
      <CollapsibleSection title="Retrieval grounding (diagnostics)" defaultOpen={false}>
        <p className="mt-0 max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
          Retrieval traces show which chunks each agent retrieved, the corpus kind, citation coverage, and token counts.
          Raw prompts and retrieved content stay redacted at this edge.
        </p>

        {failure ? (
          <>
            <p className="mb-2 text-sm font-semibold">Retrieval grounding could not be loaded.</p>
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
              variant="warning"
            />
          </>
        ) : null}

        {!failure && rows.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No retrieval grounding recorded for this review. This is expected for simulator-only reviews or agents that did not
            use retrieval.
          </p>
        ) : null}

        {!failure && degraded ? (
          <div
            role="status"
            className="mb-3 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
          >
            Some persisted retrieval metadata could not be parsed. Chunk ids and coverage remain available where recorded.
          </div>
        ) : null}

        {!failure && rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left dark:border-neutral-700">
                  <th className="px-1.5 py-2">Agent</th>
                  <th className="px-1.5 py-2">Corpus</th>
                  <th className="px-1.5 py-2">Chunks</th>
                  <th className="px-1.5 py-2">Documents</th>
                  <th className="px-1.5 py-2">Scores</th>
                  <th className="px-1.5 py-2">Coverage</th>
                  <th className="px-1.5 py-2">Tokens</th>
                  <th className="px-1.5 py-2">Trace</th>
                  <th className="px-1.5 py-2">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.traceId} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="whitespace-nowrap px-1.5 py-2">{row.agentName?.trim() || "Unknown"}</td>
                    <td className="whitespace-nowrap px-1.5 py-2">{row.corpusKind?.trim() || "-"}</td>
                    <td className="max-w-[14rem] px-1.5 py-2 font-mono text-xs" title={row.retrievedChunkIds.join(", ")}>
                      {shortList(row.retrievedChunkIds, 3)}
                    </td>
                    <td className="max-w-[12rem] px-1.5 py-2 font-mono text-xs" title={row.documentIds.join(", ")}>
                      {row.documentMetadataMalformed ? "degraded" : shortList(row.documentIds, 2)}
                    </td>
                    <td className="max-w-[12rem] px-1.5 py-2 font-mono text-xs">{scoreText(row)}</td>
                    <td className="whitespace-nowrap px-1.5 py-2">{pct(row.citationCoverage)}</td>
                    <td className="whitespace-nowrap px-1.5 py-2">
                      {optionalNumber(row.tokensIn)} in / {optionalNumber(row.tokensOut)} out
                    </td>
                    <td className="max-w-[12rem] truncate px-1.5 py-2 font-mono text-xs" title={row.traceId}>
                      {row.agentExecutionTraceId?.trim() || row.traceId}
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-2 text-xs text-neutral-600 dark:text-neutral-400">
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
