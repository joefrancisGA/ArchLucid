import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import { formatArchitectureIntelligenceSpendSummary } from "@/lib/architecture/architecture-intelligence-api";

export type ArchitectureIntelligenceRunTechnicalDetail = {
  readonly label: string;
  readonly value: string;
};

const OMITTED_COUNT_LABEL = "Not returned";

function resolveIntegrityPassedFindingCount(result: ClosedLoopReasoningResult): number | null {
  if (result.integrityPassedFindingIds === undefined || result.integrityPassedFindingIds === null) {
    return null;
  }

  return result.integrityPassedFindingIds.length;
}

function resolveStructuredElementCount(result: ClosedLoopReasoningResult): number | null {
  const elements = result.model?.elements;

  if (elements === undefined || elements === null) {
    return null;
  }

  return elements.length;
}

/** Buyer-visible one-line summary after an architecture intelligence run. */
export function formatArchitectureIntelligenceRunHeadline(
  result: ClosedLoopReasoningResult,
  options?: { readonly assertedTrailEmpty?: boolean },
): string {
  const findingCount = resolveIntegrityPassedFindingCount(result);

  if (findingCount === null) {
    return "Analysis complete · Finding count not returned";
  }

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
  const elementCount = resolveStructuredElementCount(result);
  const findingCount = resolveIntegrityPassedFindingCount(result);

  const details: ArchitectureIntelligenceRunTechnicalDetail[] = [
    {
      label: "Structured details parsed",
      value: elementCount === null ? OMITTED_COUNT_LABEL : String(elementCount),
    },
    {
      label: "Findings passed evidence checks",
      value: findingCount === null ? OMITTED_COUNT_LABEL : String(findingCount),
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
