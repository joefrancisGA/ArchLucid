import { getRunSummary } from "@/lib/api";
import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-summary-derive";
import type { RunDetail } from "@/types/authority";

/**
 * Buyer-summary (TB-283 / TB-930) omits agent `results[].findings` and fat JSON blobs.
 * Prefer `findingSummaries` for QuickDecision first paint; never call fat `getRunDetail` here.
 * Optionally fill `goldenManifestId` from the lightweight run summary endpoint.
 */

type BuyerFindingSummaryWire = {
  findingId?: string | null;
  title?: string | null;
  category?: string | null;
  severity?: string | number | null;
  engineType?: string | null;
  policyRuleId?: string | null;
};

function trimmedGoldenManifestId(run: RunDetail["run"]): string {
  return run.goldenManifestId?.trim() ?? "";
}

function readFindingSummaries(detail: RunDetail): BuyerFindingSummaryWire[] {
  const raw = (detail as Record<string, unknown>).findingSummaries;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((row): row is BuyerFindingSummaryWire => row !== null && typeof row === "object");
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
        severity: row.severity ?? undefined,
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
    },
  ];
}

export async function mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
  runId: string,
  buyerSummaryDetail: RunDetail,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetail> {
  const buyerHasFindings = extractQuickDecisionFindingsFromRunDetail(buyerSummaryDetail).length > 0;
  const buyerGoldenManifestId = trimmedGoldenManifestId(buyerSummaryDetail.run);

  let resolved: RunDetail = buyerSummaryDetail;

  if (!buyerHasFindings) {
    const summaries = readFindingSummaries(buyerSummaryDetail);
    const synthesized = synthesizeResultsFromFindingSummaries(runId, summaries);

    if (synthesized.length > 0) {
      resolved = {
        ...buyerSummaryDetail,
        results: synthesized,
      };
    }
  }

  if (trimmedGoldenManifestId(resolved.run).length > 0) {
    return resolved;
  }

  try {
    const summary = await getRunSummary(runId, options);
    const summaryGolden =
      typeof summary.goldenManifestId === "string" ? summary.goldenManifestId.trim() : "";

    if (summaryGolden.length === 0) {
      return resolved;
    }

    return {
      ...resolved,
      run: {
        ...resolved.run,
        goldenManifestId: summaryGolden,
      },
    };
  } catch {
    return resolved;
  }
}
