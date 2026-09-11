import {
  classifyReviewFindingJobView,
  isApprovedDecisionFinding,
} from "@/lib/findings/finding-job-view";
import { humanReviewStatusDisplay, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import type { TransparencyTrail } from "@/types/feasibility-verdict";

import {
  deriveOpenUnverifiedAssumptionTextsForReview,
  parseUnverifiedAssumptions,
} from "./assumption-and-severity";
import { countSkippedMustQuestions } from "./count-skipped-must-questions";
import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";
import type { FinalizeQualityScorecardInput } from "./finalize-quality-scorecard";

export type DeriveFinalizeQualityScorecardOptions = {
  readonly acknowledgedAssumptionIds?: ReadonlySet<string>;
  readonly requestAssumptionTexts?: readonly string[];
  readonly transparencyTrail?: TransparencyTrail | null;
  /** WS-14: Working seats block finalize when finding-engine coverage is degraded. */
  readonly degradedFindingCoverage?: boolean;
  readonly degradedFindingCoverageFailedEngineLabels?: readonly string[];
  readonly blockDegradedFindingCoverageOnWorking?: boolean;
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

function isUnresolvedBlockingReviewFinding(finding: QuickDecisionFinding): boolean {
  if (finding.isMuted || finding.enforcementTier === "Advisory") {
    return false;
  }

  if (finding.severityValue < 2 || isFinalizeResolvedReviewFinding(finding)) {
    return false;
  }

  return true;
}

/** TB-2321: derive finalize scorecard inputs from live finding rows when API metrics are absent. */
export function deriveFinalizeQualityScorecardInput(
  findings: readonly QuickDecisionFinding[],
  blockingFindingCount: number,
  options?: DeriveFinalizeQualityScorecardOptions,
): FinalizeQualityScorecardInput {
  const mergedAssumptionTexts = deriveOpenUnverifiedAssumptionTextsForReview(
    findings,
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
  const openVerifyHypothesisCount = findings.filter(
    (finding) => !finding.isMuted && classifyReviewFindingJobView(finding) === "verify-hypotheses",
  ).length;
  const openDeferredCount = findings.filter(
    (finding) => !finding.isMuted && classifyReviewFindingJobView(finding) === "deferred",
  ).length;
  const openContradictionCount = findings.filter(
    (finding) => !finding.isMuted && classifyReviewFindingJobView(finding) === "resolve-contradictions",
  ).length;
  const uncoveredMandatoryRequirementCount = findings.filter(
    (finding) => !finding.isMuted && classifyReviewFindingJobView(finding) === "coverage-gaps",
  ).length;
  const derivedBlockingFindingCount = findings.filter(isUnresolvedBlockingReviewFinding).length;
  let unresolvedHighSeverityDispositionCount = 0;

  for (const finding of findings) {
    if (finding.isMuted || finding.severityValue < 2 || isFinalizeResolvedReviewFinding(finding)) {
      continue;
    }

    unresolvedHighSeverityDispositionCount += 1;
  }

  return {
    blockingFindingCount: Math.max(Math.trunc(blockingFindingCount), derivedBlockingFindingCount),
    unverifiedAssumptionCount: assumptions.length,
    unacknowledgedExistentialAssumptionCount,
    uncoveredMandatoryRequirementCount,
    openDeferredCount,
    openContradictionCount,
    openCannotDetermineCount,
    openVerifyHypothesisCount,
    lowExtractionConfidenceCount,
    unresolvedHighSeverityDispositionCount,
    skippedMustCount: countSkippedMustQuestions(options?.transparencyTrail),
    transparencyTrailIncomplete:
      options?.transparencyTrail !== undefined &&
      !isTransparencyTrailComplete(options.transparencyTrail),
    degradedFindingCoverage: options?.degradedFindingCoverage === true,
    degradedFindingCoverageFailedEngineLabels: options?.degradedFindingCoverageFailedEngineLabels ?? [],
    blockDegradedFindingCoverageOnWorking: options?.blockDegradedFindingCoverageOnWorking === true,
  };
}

/** Approved decision titles for apply-change override checks (TB-2311). */
export function deriveApprovedDecisionTitlesFromFindings(
  findings: readonly QuickDecisionFinding[],
): readonly string[] {
  const titles: string[] = [];

  for (const finding of findings) {
    if (finding.isMuted || !isApprovedDecisionFinding(finding)) {
      continue;
    }

    const title = finding.title.trim();

    if (title.length >= 8) {
      titles.push(title);
    }
  }

  return titles;
}
