import {
  classifyReviewFindingJobView,
} from "@/lib/findings/finding-job-view";
import { humanReviewStatusDisplay, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  deriveUnverifiedAssumptionTextsFromFindings,
  mergeUnverifiedAssumptionTexts,
  parseUnverifiedAssumptions,
} from "./assumption-and-severity";
import type { FinalizeQualityScorecardInput } from "./finalize-quality-scorecard";

export type DeriveFinalizeQualityScorecardOptions = {
  readonly acknowledgedAssumptionIds?: ReadonlySet<string>;
  readonly requestAssumptionTexts?: readonly string[];
};

const FINALIZE_RESOLVED_DISPOSITIONS = new Set([
  "Accepted",
  "RejectedAsNotApplicable",
  "Remediated",
]);

function readDispositionFromReviewFinding(finding: QuickDecisionFinding): string | null {
  try {
    const parsed: unknown = JSON.parse(finding.aiReasoning.wireJson);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const disposition = (parsed as { latestDisposition?: unknown }).latestDisposition;

    return typeof disposition === "string" && disposition.trim().length > 0 ? disposition.trim() : null;
  } catch {
    return null;
  }
}

function isFinalizeResolvedReviewFinding(finding: QuickDecisionFinding): boolean {
  const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);

  if (reviewStatus?.label === "Approved" || reviewStatus?.label === "Overridden") {
    return true;
  }

  const disposition = readDispositionFromReviewFinding(finding);

  return disposition !== null && FINALIZE_RESOLVED_DISPOSITIONS.has(disposition);
}

function deriveUnverifiedAssumptionTexts(findings: readonly QuickDecisionFinding[]): string[] {
  return deriveUnverifiedAssumptionTextsFromFindings(
    findings,
    (finding) => !finding.isMuted && !isFinalizeResolvedReviewFinding(finding),
  );
}

/** TB-2321: derive finalize scorecard inputs from live finding rows when API metrics are absent. */
export function deriveFinalizeQualityScorecardInput(
  findings: readonly QuickDecisionFinding[],
  blockingFindingCount: number,
  options?: DeriveFinalizeQualityScorecardOptions,
): FinalizeQualityScorecardInput {
  const mergedAssumptionTexts = mergeUnverifiedAssumptionTexts(
    deriveUnverifiedAssumptionTexts(findings),
    options?.requestAssumptionTexts ?? [],
  );
  let assumptions = parseUnverifiedAssumptions(mergedAssumptionTexts);
  const acknowledgedIds = options?.acknowledgedAssumptionIds;

  if (acknowledgedIds !== undefined) {
    assumptions = assumptions.filter((assumption) => !acknowledgedIds.has(assumption.id));
  }

  const unacknowledgedExistentialAssumptionCount = assumptions.filter(
    (assumption) => assumption.existential,
  ).length;
  let lowExtractionConfidenceCount = 0;

  for (const finding of findings) {
    if (finding.isMuted || finding.severityValue < 2 || isFinalizeResolvedReviewFinding(finding)) {
      continue;
    }

    if (finding.confidenceLevel === "Low") {
      lowExtractionConfidenceCount += 1;
    }
  }

  const openCannotDetermineCount = findings.filter(
    (finding) => !finding.isMuted && classifyReviewFindingJobView(finding) === "answer-these-questions",
  ).length;
  const uncoveredMandatoryRequirementCount = findings.filter(
    (finding) => !finding.isMuted && classifyReviewFindingJobView(finding) === "coverage-gaps",
  ).length;

  return {
    blockingFindingCount: Math.max(0, Math.trunc(blockingFindingCount)),
    unverifiedAssumptionCount: assumptions.length,
    unacknowledgedExistentialAssumptionCount,
    uncoveredMandatoryRequirementCount,
    openCannotDetermineCount,
    lowExtractionConfidenceCount,
  };
}

/** Approved decision titles for apply-change override checks (TB-2311). */
export function deriveApprovedDecisionTitlesFromFindings(
  findings: readonly QuickDecisionFinding[],
): readonly string[] {
  const titles: string[] = [];

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (reviewStatus?.label !== "Approved") {
      continue;
    }

    const title = finding.title.trim();

    if (title.length >= 8) {
      titles.push(title);
    }
  }

  return titles;
}
