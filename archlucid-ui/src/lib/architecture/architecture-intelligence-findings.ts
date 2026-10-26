import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";

export const ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED = "Severity was not stored." as const;

export const ARCHITECTURE_INTELLIGENCE_FINDING_TITLE_NOT_STORED = "Finding title was not stored." as const;

export const ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED = "Conclusion was not stored." as const;

export const ARCHITECTURE_INTELLIGENCE_INTEGRITY_PASSED_COUNT_NOT_STORED =
  "Integrity-passed finding count was not stored." as const;

export type ArchitectureIntelligenceFindingPreview = {
  readonly findingId: string;
  readonly title: string;
  readonly severity: string | null;
  readonly conclusion: string | null;
  readonly integrityPassed: boolean;
};

export type IntegrityPassedFindingIdsPresence =
  | { readonly kind: "omitted" }
  | { readonly kind: "stored"; readonly count: number };

const DEFAULT_INLINE_FINDING_LIMIT = 3;

export function resolveIntegrityPassedFindingIdsPresence(
  result: ClosedLoopReasoningResult,
): IntegrityPassedFindingIdsPresence {
  if (result.integrityPassedFindingIds === undefined || result.integrityPassedFindingIds === null) {
    return { kind: "omitted" };
  }

  return { kind: "stored", count: result.integrityPassedFindingIds.length };
}

export function flattenArchitectureIntelligenceFindings(
  result: ClosedLoopReasoningResult,
): ArchitectureIntelligenceFindingPreview[] {
  const integritySet = new Set(result.integrityPassedFindingIds ?? []);

  return (result.specialistReviews ?? []).flatMap((review) =>
    (review.findings ?? []).map((finding, index) => {
      const findingId = finding.findingId?.trim() || `${finding.title ?? "finding"}-${index}`;
      const titleTrimmed = finding.title?.trim() ?? "";
      const title =
        titleTrimmed.length > 0 ? titleTrimmed : ARCHITECTURE_INTELLIGENCE_FINDING_TITLE_NOT_STORED;
      const severityTrimmed = finding.severity?.trim() ?? "";
      const severity = severityTrimmed.length > 0 ? severityTrimmed : null;
      const conclusionTrimmed =
        finding.conclusion?.trim() || finding.rationale?.trim() || "";
      const conclusion =
        conclusionTrimmed.length > 0 ? conclusionTrimmed : ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED;

      return {
        findingId,
        title,
        severity,
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
  const presence = resolveIntegrityPassedFindingIdsPresence(result);

  if (presence.kind === "stored") {
    return presence.count;
  }

  return flattenArchitectureIntelligenceFindings(result).filter((finding) => finding.integrityPassed).length;
}

export function formatIntegrityPassedFindingCountDisplay(
  result: ClosedLoopReasoningResult,
): string {
  const presence = resolveIntegrityPassedFindingIdsPresence(result);

  if (presence.kind === "omitted") {
    return ARCHITECTURE_INTELLIGENCE_INTEGRITY_PASSED_COUNT_NOT_STORED;
  }

  return String(presence.count);
}
