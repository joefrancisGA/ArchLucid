/** WK-09 / WK-19 / LP-05 — sealed snapshot vs agent advisory stream labels. */

export const SEALED_FINDINGS_STREAM_LABEL = "Deterministic findings (sealed)";

export const AGENT_FINDINGS_STREAM_LABEL = "Agent findings (advisory)";

export const BUYER_SUMMARY_AGENT_FINDINGS_OMISSION_LINE =
  "Advisory agent findings are not included in this buyer summary. Open the full review workspace for the agent stream.";

export const SEALED_FINDINGS_STREAM_COUNT_NOT_STORED = "Sealed stream count was not stored." as const;
export const AGENT_FINDINGS_STREAM_COUNT_NOT_STORED = "Agent stream count was not stored." as const;

export function formatFindingStreamDualCountLine(
  sealedCount: number | null | undefined,
  agentCount: number | null | undefined,
): string {
  const sealedPart =
    sealedCount === null || sealedCount === undefined
      ? SEALED_FINDINGS_STREAM_COUNT_NOT_STORED
      : String(Math.max(0, Math.trunc(sealedCount)));
  const agentPart =
    agentCount === null || agentCount === undefined
      ? AGENT_FINDINGS_STREAM_COUNT_NOT_STORED
      : String(Math.max(0, Math.trunc(agentCount)));

  return `${SEALED_FINDINGS_STREAM_LABEL}: ${sealedPart} · ${AGENT_FINDINGS_STREAM_LABEL}: ${agentPart}`;
}
