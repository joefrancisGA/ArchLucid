import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-summary-derive";
import type { RunDetail } from "@/types/authority";

/**
 * Buyer-summary (TB-283 / TB-930) omits agent `results[].findings` and fat JSON blobs.
 * Prefer `findingSummaries` for QuickDecision first paint; never call fat `getRunDetail` here.
 */

type BuyerFindingSummaryWire = {
  findingId?: string | null;
  title?: string | null;
  category?: string | null;
  severity?: string | number | null;
  engineType?: string | null;
  policyRuleId?: string | null;
};

function readFindingSummaries(detail: RunDetail): BuyerFindingSummaryWire[] {
  const raw = (detail as Record<string, unknown>).findingSummaries;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((row): row is BuyerFindingSummaryWire => row !== null && typeof row === "object");
}

type BuyerFindingSeverityWire = "Info" | "Warning" | "Error" | "Critical";

function coerceBuyerFindingSeverity(raw: unknown): BuyerFindingSeverityWire | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const byOrdinal: Record<number, BuyerFindingSeverityWire> = {
      0: "Info",
      1: "Warning",
      2: "Error",
      3: "Critical",
    };

    return byOrdinal[Math.trunc(raw)];
  }

  if (typeof raw !== "string") {
    return undefined;
  }

  const trimmed = raw.trim();

  if (
    trimmed === "Info"
    || trimmed === "Warning"
    || trimmed === "Error"
    || trimmed === "Critical"
  ) {
    return trimmed;
  }

  return undefined;
}

function synthesizeResultsFromFindingSummaries(
  runId: string,
  summaries: readonly BuyerFindingSummaryWire[],
): NonNullable<RunDetail["results"]> {
  const findings = summaries
    .map((row) => {
      const findingId = typeof row.findingId === "string" ? row.findingId.trim() : "";

      if (findingId.length === 0) {
        return null;
      }

      const title = typeof row.title === "string" ? row.title.trim() : "";
      const category = typeof row.category === "string" ? row.category.trim() : "";
      const policyRuleId =
        typeof row.policyRuleId === "string" && row.policyRuleId.trim().length > 0
          ? row.policyRuleId.trim()
          : undefined;

      return {
        findingId,
        message: title.length > 0 ? title : category.length > 0 ? category : findingId,
        category: category.length > 0 ? category : undefined,
        severity: coerceBuyerFindingSeverity(row.severity),
        policyRuleId,
        reasoningTrace: "",
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (findings.length === 0) {
    return [];
  }

  return [
    {
      resultId: `buyer-summary-${runId}`,
      taskId: "buyer-summary",
      runId,
      agentType: "Compliance",
      findings,
      confidence: 0,
      claims: [],
      evidenceRefs: [],
    },
  ];
}

export async function mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
  runId: string,
  buyerSummaryDetail: RunDetail,
  _options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetail> {
  void _options;

  const buyerHasFindings = extractQuickDecisionFindingsFromRunDetail(buyerSummaryDetail).length > 0;

  if (buyerHasFindings) {
    return buyerSummaryDetail;
  }

  const summaries = readFindingSummaries(buyerSummaryDetail);
  const synthesized = synthesizeResultsFromFindingSummaries(runId, summaries);

  if (synthesized.length === 0) {
    return buyerSummaryDetail;
  }

  return {
    ...buyerSummaryDetail,
    results: synthesized,
  };
}
