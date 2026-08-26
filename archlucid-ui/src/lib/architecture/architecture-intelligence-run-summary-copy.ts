import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import { formatArchitectureIntelligenceSpendSummary } from "@/lib/architecture/architecture-intelligence-api";

export type ArchitectureIntelligenceRunTechnicalDetail = {
  readonly label: string;
  readonly value: string;
};

/** Buyer-visible one-line summary after an architecture intelligence run. */
export function formatArchitectureIntelligenceRunHeadline(result: ClosedLoopReasoningResult): string {
  const findingCount = result.integrityPassedFindingIds?.length ?? 0;

  return `Analysis complete · ${formatEvidenceBackedFindingsPhrase(findingCount)}`;
}

function formatEvidenceBackedFindingsPhrase(count: number): string {
  if (count === 0) {
    return "No evidence-backed findings yet";
  }

  if (count === 1) {
    return "1 evidence-backed finding";
  }

  return `${count} evidence-backed findings`;
}

/** Operator diagnostics hidden behind progressive disclosure. */
export function listArchitectureIntelligenceRunTechnicalDetails(
  result: ClosedLoopReasoningResult,
): ArchitectureIntelligenceRunTechnicalDetail[] {
  const details: ArchitectureIntelligenceRunTechnicalDetail[] = [
    {
      label: "Structured details parsed",
      value: String(result.model?.elements?.length ?? 0),
    },
    {
      label: "Findings passed evidence checks",
      value: String(result.integrityPassedFindingIds?.length ?? 0),
    },
    {
      label: "Result source",
      value: describeArchitectureIntelligenceResultSource(result),
    },
  ];

  const spendSummary = formatArchitectureIntelligenceSpendSummary(result).replace(/^ · /, "");

  if (spendSummary.length > 0) {
    details.push({
      label: "AI usage",
      value: spendSummary,
    });
  }

  const runId = result.runId?.trim() ?? "";

  if (runId.length > 0) {
    details.push({
      label: "Run id",
      value: runId,
    });
  }

  return details;
}

function describeArchitectureIntelligenceResultSource(result: ClosedLoopReasoningResult): string {
  if (result.cacheHit) {
    return result.cacheReuseReason
      ? `Reused prior analysis (${result.cacheReuseReason})`
      : "Reused prior analysis";
  }

  return "Fresh analysis run";
}
