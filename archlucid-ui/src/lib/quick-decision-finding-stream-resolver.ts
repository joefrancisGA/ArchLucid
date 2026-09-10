import type { RunDetail } from "@/types/authority";

import {
  extractQuickDecisionFindingsFromRunDetail,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-finding-from-detail";

export type FindingStreamBand = "sealed" | "agent";

export type RunDetailFindingStreams = {
  readonly sealedFindings: QuickDecisionFinding[];
  readonly agentFindings: QuickDecisionFinding[];
  readonly buyerSummaryOmitsAgentFindings: boolean;
};

const BUYER_SUMMARY_TASK_ID = "buyer-summary";
const BUYER_SUMMARY_RESULT_PREFIX = "buyer-summary-";

export function isBuyerSummarySyntheticAgentResult(result: Record<string, unknown>): boolean {
  const taskId = typeof result.taskId === "string" ? result.taskId.trim() : "";

  if (taskId === BUYER_SUMMARY_TASK_ID) {
    return true;
  }

  const resultId = typeof result.resultId === "string" ? result.resultId.trim() : "";

  return resultId.startsWith(BUYER_SUMMARY_RESULT_PREFIX);
}

function tagFindingStreamBand(
  findings: readonly QuickDecisionFinding[],
  streamBand: FindingStreamBand,
): QuickDecisionFinding[] {
  return findings.map((finding) => ({
    ...finding,
    streamBand,
  }));
}

function readFindingSummaries(detail: RunDetail): Record<string, unknown>[] {
  const raw = (detail as Record<string, unknown>).findingSummaries;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((row): row is Record<string, unknown> => row !== null && typeof row === "object");
}

function mapFindingSummaryRowToQuickDecision(
  row: Record<string, unknown>,
  order: number,
): QuickDecisionFinding | null {
  const findingId = typeof row.findingId === "string" ? row.findingId.trim() : "";

  if (findingId.length === 0) {
    return null;
  }

  const title = typeof row.title === "string" ? row.title.trim() : "";
  const category = typeof row.category === "string" ? row.category.trim() : "";
  const message = title.length > 0 ? title : category.length > 0 ? category : findingId;
  const policyRuleId =
    typeof row.policyRuleId === "string" && row.policyRuleId.trim().length > 0
      ? row.policyRuleId.trim()
      : null;

  let wireJson: string;

  try {
    wireJson = JSON.stringify(row, null, 2);
  } catch {
    wireJson = '{"error":"finding_summary_not_json_serializable"}';
  }

  return {
    findingId,
    title: message,
    recommendation: "",
    severityValue: 1,
    findingOrder: order,
    aiReasoning: { wireJson, reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    policyRuleId,
    streamBand: "sealed",
  };
}

function extractSealedFromFindingSummaries(detail: RunDetail): QuickDecisionFinding[] {
  const summaries = readFindingSummaries(detail);
  const out: QuickDecisionFinding[] = [];
  let order = 0;

  for (const row of summaries) {
    const mapped = mapFindingSummaryRowToQuickDecision(row, order);

    if (mapped === null) {
      continue;
    }

    out.push(mapped);
    order += 1;
  }

  return out;
}

function extractSealedFromFindingsSnapshot(detail: RunDetail): QuickDecisionFinding[] {
  const snapshot = (detail as Record<string, unknown>).findingsSnapshot;

  if (snapshot === null || typeof snapshot !== "object") {
    return [];
  }

  const findings = (snapshot as Record<string, unknown>).findings;

  if (!Array.isArray(findings) || findings.length === 0) {
    return [];
  }

  const pseudoDetail = {
    ...detail,
    results: [
      {
        resultId: "findings-snapshot-sealed",
        taskId: "findings-snapshot",
        runId: detail.run.runId,
        agentType: "Compliance",
        findings,
      },
    ],
  } as unknown as RunDetail;

  return tagFindingStreamBand(extractQuickDecisionFindingsFromRunDetail(pseudoDetail), "sealed");
}

function extractSealedFromBuyerSummarySyntheticResults(detail: RunDetail): QuickDecisionFinding[] {
  const raw = detail as Record<string, unknown>;
  const results = raw.results;

  if (!Array.isArray(results)) {
    return [];
  }

  const syntheticResults = results.filter(
    (row): row is Record<string, unknown> => row !== null && typeof row === "object" && isBuyerSummarySyntheticAgentResult(row),
  );

  if (syntheticResults.length === 0) {
    return [];
  }

  const pseudoDetail = {
    ...detail,
    results: syntheticResults,
  } as unknown as RunDetail;

  return tagFindingStreamBand(extractQuickDecisionFindingsFromRunDetail(pseudoDetail), "sealed");
}

/** Sealed / typed snapshot rows — product of record for finalize and career export. */
export function extractSealedQuickDecisionFindingsFromRunDetail(detail: RunDetail): QuickDecisionFinding[] {
  const fromSnapshot = extractSealedFromFindingsSnapshot(detail);

  if (fromSnapshot.length > 0) {
    return fromSnapshot;
  }

  const fromSynthetic = extractSealedFromBuyerSummarySyntheticResults(detail);

  if (fromSynthetic.length > 0) {
    return fromSynthetic;
  }

  return extractSealedFromFindingSummaries(detail);
}

/** Agent `results[].findings` only — advisory rehearsal stream, never explanation traces. */
export function extractAgentQuickDecisionFindingsFromRunDetail(detail: RunDetail): QuickDecisionFinding[] {
  const raw = detail as Record<string, unknown>;
  const results = raw.results;

  if (!Array.isArray(results)) {
    return [];
  }

  const agentResults = results.filter(
    (row): row is Record<string, unknown> => row !== null && typeof row === "object" && !isBuyerSummarySyntheticAgentResult(row),
  );

  if (agentResults.length === 0) {
    return [];
  }

  const pseudoDetail = {
    ...detail,
    results: agentResults,
  } as unknown as RunDetail;

  return tagFindingStreamBand(extractQuickDecisionFindingsFromRunDetail(pseudoDetail), "agent");
}

function readAgentExecutionOutcomes(detail: RunDetail): readonly Record<string, unknown>[] {
  const raw = (detail as Record<string, unknown>).agentExecutionOutcomes;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((row): row is Record<string, unknown> => row !== null && typeof row === "object");
}

export function buyerSummaryOmitsAgentFindings(detail: RunDetail, agentFindings: readonly QuickDecisionFinding[]): boolean {
  if (agentFindings.length > 0) {
    return false;
  }

  const outcomes = readAgentExecutionOutcomes(detail);

  return outcomes.some((row) => {
    const outcome = typeof row.outcome === "string" ? row.outcome.trim() : "";

    return outcome === "Succeeded" || outcome === "Degraded";
  });
}
