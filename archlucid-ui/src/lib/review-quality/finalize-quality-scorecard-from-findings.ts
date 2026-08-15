import {
  classifyReviewFindingJobView,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { humanReviewStatusDisplay, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  countExistentialUnverifiedAssumptions,
  parseUnverifiedAssumptions,
} from "./assumption-and-severity";
import type { FinalizeQualityScorecardInput } from "./finalize-quality-scorecard";

const OPEN_QUALITY_JOB_VIEWS: readonly FindingJobView[] = [
  "answer-these-questions",
  "coverage-gaps",
];

function countOpenFindingsForJobViews(findings: readonly QuickDecisionFinding[]): number {
  let count = 0;

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const jobView = classifyReviewFindingJobView(finding);

    if (OPEN_QUALITY_JOB_VIEWS.includes(jobView)) {
      count += 1;
    }
  }

  return count;
}

function deriveUnverifiedAssumptionTexts(findings: readonly QuickDecisionFinding[]): string[] {
  const texts: string[] = [];

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const combined = `${finding.title}\n${finding.recommendation}\n${finding.aiReasoning.reasoningTrace}`;

    if (!/assumption/i.test(combined)) {
      continue;
    }

    const trimmedTitle = finding.title.trim();

    if (trimmedTitle.length > 0) {
      texts.push(trimmedTitle);
    }
  }

  return texts;
}

/** TB-2321: derive finalize scorecard inputs from live finding rows when API metrics are absent. */
export function deriveFinalizeQualityScorecardInput(
  findings: readonly QuickDecisionFinding[],
  blockingFindingCount: number,
): FinalizeQualityScorecardInput {
  const openQualityGaps = countOpenFindingsForJobViews(findings);
  const assumptions = parseUnverifiedAssumptions(deriveUnverifiedAssumptionTexts(findings));
  const existentialAssumptions = countExistentialUnverifiedAssumptions(assumptions);
  let lowExtractionConfidenceCount = 0;

  for (const finding of findings) {
    if (finding.isMuted || finding.severityValue < 2) {
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
    unverifiedAssumptionCount: existentialAssumptions > 0 ? existentialAssumptions : assumptions.length,
    uncoveredMandatoryRequirementCount:
      uncoveredMandatoryRequirementCount > 0 ? uncoveredMandatoryRequirementCount : openQualityGaps,
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
