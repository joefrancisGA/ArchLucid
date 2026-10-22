/** WK-09 / WK-19 / LP-05 — sealed snapshot vs agent advisory stream labels. */

export const SEALED_FINDINGS_STREAM_LABEL = "Deterministic findings (sealed)";

export const AGENT_FINDINGS_STREAM_LABEL = "Agent findings (advisory)";

export const BUYER_SUMMARY_AGENT_FINDINGS_OMISSION_LINE =
  "Advisory agent findings are not included in this buyer summary. Open the full review workspace for the agent stream.";

export function formatFindingStreamDualCountLine(sealedCount: number, agentCount: number): string {
  return `${SEALED_FINDINGS_STREAM_LABEL}: ${sealedCount} · ${AGENT_FINDINGS_STREAM_LABEL}: ${agentCount}`;
}
