import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import { formatArchitectureIntelligenceSpendSummary } from "@/lib/architecture/architecture-intelligence-api";

export type ArchitectureIntelligenceRunTechnicalDetail = {
  readonly label: string;
  readonly value: string;
};

function optionalArrayLengthLabel(items: readonly unknown[] | undefined | null): string {
  if (items === undefined || items === null) {
    return "Not returned";
  }

  return String(items.length);
}

function resolveFindingCount(
  result: ClosedLoopReasoningResult,
): { readonly known: true; readonly count: number } | { readonly known: false } {
  const ids = result.integrityPassedFindingIds;

  if (ids === undefined || ids === null) {
    return { known: false };
  }

  return { known: true, count: ids.length };
}

/** Buyer-visible one-line summary after an architecture intelligence run. */
export function formatArchitectureIntelligenceRunHeadline(
  result: ClosedLoopReasoningResult,
  options?: { readonly assertedTrailEmpty?: boolean },
): string {
  const finding = resolveFindingCount(result);

  if (!finding.known) {
    return "Analysis complete · Finding count not returned";
  }

  const findingCount = finding.count;

  if (options?.assertedTrailEmpty === true) {
    if (findingCount === 0) {
      return "Analysis complete · No governed findings yet";
    }

    if (findingCount === 1) {
      return "Analysis complete · 1 governed finding";
    }

    return `Analysis complete · ${findingCount} governed findings`;
  }

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
      value: optionalArrayLengthLabel(result.model?.elements),
    },
    {
      label: "Findings passed evidence checks",
      value: optionalArrayLengthLabel(result.integrityPassedFindingIds),
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
