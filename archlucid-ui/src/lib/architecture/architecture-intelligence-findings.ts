import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";

export type ArchitectureIntelligenceFindingPreview = {
  readonly findingId: string;
  readonly title: string;
  readonly severity: string;
  readonly conclusion: string;
  readonly integrityPassed: boolean;
};

const DEFAULT_INLINE_FINDING_LIMIT = 3;

export function flattenArchitectureIntelligenceFindings(
  result: ClosedLoopReasoningResult,
): ArchitectureIntelligenceFindingPreview[] {
  const integritySet = new Set(result.integrityPassedFindingIds ?? []);

  return (result.specialistReviews ?? []).flatMap((review) =>
    (review.findings ?? []).map((finding, index) => {
      const findingId = finding.findingId?.trim() || `${finding.title ?? "finding"}-${index}`;
      const title = finding.title?.trim() || "Untitled finding";
      const conclusion = finding.conclusion?.trim() || finding.rationale?.trim() || "";

      return {
        findingId,
        title,
        severity: finding.severity?.trim() || "Medium",
        conclusion,
        integrityPassed: integritySet.has(findingId),
      };
    }),
  );
}

export function listIntegrityPassedFindingPreviews(
  result: ClosedLoopReasoningResult,
  limit: number = DEFAULT_INLINE_FINDING_LIMIT,
): ArchitectureIntelligenceFindingPreview[] {
  const passed = flattenArchitectureIntelligenceFindings(result).filter(
    (finding) => finding.integrityPassed,
  );

  if (limit <= 0) {
    return passed;
  }

  return passed.slice(0, limit);
}

export function countIntegrityPassedFindings(result: ClosedLoopReasoningResult): number {
  const integrityCount = result.integrityPassedFindingIds?.length ?? 0;

  if (integrityCount > 0) {
    return integrityCount;
  }

  return flattenArchitectureIntelligenceFindings(result).filter((finding) => finding.integrityPassed).length;
}
