import {
  formatInsightDensityMeasurementFloorBlockedReason,
  formatInsightDensityMeasurementFloorPresentation,
  type InsightDensityMeasurementFloorOptions,
  type InsightDensityMeasurementFloorPresentation,
} from "@/lib/quality/insight-density-measurement-floor";
import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";
import { readJudgeSkippedByCapFromFindingsSnapshot } from "@/lib/findings/read-judge-skipped-by-cap";
import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";
import { formatPreCommitGateDisabledCareerBlockedReason } from "@/lib/governance/pre-commit-gate-career-honesty";
import { formatQualityGateCareerExportBlockedReason } from "@/lib/governance/agent-output-quality-gate-career-honesty";
import { evaluateCareerArtifactHonesty } from "@/lib/career-artifact/career-artifact-honesty";
import { listSkippedMustQuestionKeys } from "@/lib/review-quality/list-skipped-must-question-keys";
import { formatSponsorReviewCoverageHonestyMarkdown } from "@/lib/sponsor/sponsor-review-coverage-honesty";
import type { SponsorReviewCoverageHonestyInputs } from "@/lib/sponsor/sponsor-review-coverage-honesty";
import { formatFeasibilityVerdictMarkdownSection } from "@/lib/feasibility/format-feasibility-verdict-markdown-section";
import { formatCareerExportFindingTrustMarkdownSection } from "@/lib/findings/format-career-export-finding-trust-markdown-section";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export type CareerExportClassificationCounts = {
  readonly decisionGrade: number;
  readonly checklist: number;
};

export type CareerExportCoverageHonestyInput = SponsorReviewCoverageHonestyInputs & {
  readonly enginesSucceeded?: number | null;
  readonly workingDesk?: boolean;
  readonly classificationCounts?: CareerExportClassificationCounts | null;
  readonly catalogAdvisoryEngineFailureCount?: number;
  readonly preCommitGateEnabled?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly hostAgentExecutionMode?: string | null;
  readonly hostQualityGateMode?: string | null;
  readonly aggregateQualityGateOutcome?: number | null;
  readonly judgeSkippedByCap?: number | null;
  readonly findingsSnapshot?: unknown;
  readonly exportFindings?: readonly QuickDecisionFinding[];
};

export type CareerExportCoverageHonesty = {
  readonly measurementFloor: InsightDensityMeasurementFloorPresentation;
  readonly measurementFloorBlockedReason: string | null;
  readonly sponsorHonestyMarkdown: string;
  readonly blockedForWorkingCareerExport: boolean;
};

/** Shared honesty block for sponsor PDF, ADR, print, and JSON career exports (PC-01 / PC-13). */
export function resolveCareerExportCoverageHonesty(
  input: CareerExportCoverageHonestyInput,
): CareerExportCoverageHonesty {
  const measurementFloorOptions = resolveMeasurementFloorOptions(input);
  const measurementFloor = formatInsightDensityMeasurementFloorPresentation(
    input.enginesSucceeded ?? null,
    measurementFloorOptions,
  );
  const measurementFloorBlockedReason = formatInsightDensityMeasurementFloorBlockedReason(
    input.enginesSucceeded ?? null,
    input.catalogAdvisoryEngineFailureCount ?? 0,
  );
  const preCommitGateBlockedReason = formatPreCommitGateDisabledCareerBlockedReason(
    input.preCommitGateEnabled,
  );
  const qualityGateBlockedReason = formatQualityGateCareerExportBlockedReason({
    workingDesk: input.workingDesk,
    structuralExecutionMode: input.structuralExecutionMode,
    isSample: input.isSample,
    hostAgentExecutionMode: input.hostAgentExecutionMode,
    hostQualityGateMode: input.hostQualityGateMode,
    aggregateQualityGateOutcome: input.aggregateQualityGateOutcome,
  });
  const workingCareerExportBlockedReason =
    preCommitGateBlockedReason ?? qualityGateBlockedReason ?? measurementFloorBlockedReason;
  const sponsorHonestyMarkdown = formatSponsorReviewCoverageHonestyMarkdown(input);
  const blockedForWorkingCareerExport =
    input.workingDesk === true && workingCareerExportBlockedReason !== null;

  return {
    measurementFloor,
    measurementFloorBlockedReason: workingCareerExportBlockedReason ?? measurementFloorBlockedReason,
    sponsorHonestyMarkdown,
    blockedForWorkingCareerExport,
  };
}

export function formatCareerExportMeasurementFloorMarkdown(
  enginesSucceeded: number | null | undefined,
  options: InsightDensityMeasurementFloorOptions = {},
): string {
  const presentation = formatInsightDensityMeasurementFloorPresentation(enginesSucceeded, options);

  return `## Measurement floor\n\n${presentation.line}\n`;
}

export function resolveCareerExportMeasurementFloorOptions(
  input: Pick<
    CareerExportCoverageHonestyInput,
    "graphSnapshot" | "progressSummary" | "judgeSkippedByCap" | "findingsSnapshot"
  >,
): InsightDensityMeasurementFloorOptions {
  return {
    actorNodeCount: countActorNodesInGraphSnapshot(input.graphSnapshot),
    analysisStagesComplete: analysisStagesCompleteOnSummary(input.progressSummary ?? null),
    judgeSkippedByCap:
      input.judgeSkippedByCap ?? readJudgeSkippedByCapFromFindingsSnapshot(input.findingsSnapshot),
  };
}

function resolveMeasurementFloorOptions(
  input: CareerExportCoverageHonestyInput,
): InsightDensityMeasurementFloorOptions {
  return resolveCareerExportMeasurementFloorOptions(input);
}

export function formatCareerExportClassificationBandMarkdown(
  counts: CareerExportClassificationCounts | null | undefined,
): string {
  const bandLine = formatCareerExportClassificationBandLine(counts);

  if (bandLine === null) {
    return "";
  }

  return `## Finding bands\n\n${bandLine}\n`;
}

export function formatCareerExportClassificationBandLine(
  counts: CareerExportClassificationCounts | null | undefined,
): string | null {
  if (counts === null || counts === undefined) {
    return null;
  }

  const decisionGrade = Math.max(0, Math.trunc(counts.decisionGrade));
  const checklist = Math.max(0, Math.trunc(counts.checklist));
  const total = decisionGrade + checklist;

  if (total === 0) {
    return null;
  }

  return `Decision-grade: ${decisionGrade} · Checklist: ${checklist} (ADR 0070 gate classification on this package snapshot).`;
}

function formatSkippedMustExportHeaderMarkdown(
  input: CareerExportCoverageHonestyInput,
): string {
  const skippedMustKeys = listSkippedMustQuestionKeys(
    input.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null,
  );

  if (skippedMustKeys.length === 0) {
    return "";
  }

  return `## Skipped required questions\n\n- ${skippedMustKeys.join(", ")}\n`;
}

/** Shared markdown honesty block for sponsor PDF, ADR, print, and manifest exports (PC-13). */
export function formatCareerExportHonestyMarkdown(input: CareerExportCoverageHonestyInput): string {
  const honesty = resolveCareerExportCoverageHonesty(input);
  const measurementFloorOptions = resolveMeasurementFloorOptions(input);
  const sections: string[] = [
    formatCareerExportMeasurementFloorMarkdown(input.enginesSucceeded ?? null, measurementFloorOptions).trim(),
  ];

  const classificationMarkdown = formatCareerExportClassificationBandMarkdown(input.classificationCounts);

  if (classificationMarkdown.trim().length > 0) {
    sections.push(classificationMarkdown.trim());
  }

  const skippedMustMarkdown = formatSkippedMustExportHeaderMarkdown(input);

  if (skippedMustMarkdown.trim().length > 0) {
    sections.push(skippedMustMarkdown.trim());
  }

  if (honesty.sponsorHonestyMarkdown.trim().length > 0) {
    sections.push(honesty.sponsorHonestyMarkdown.trim());
  }

  const feasibilityVerdictMarkdown = formatFeasibilityVerdictMarkdownSection(
    input.manifestSummary?.feasibilityVerdict ?? null,
  );

  if (feasibilityVerdictMarkdown.trim().length > 0) {
    sections.push(feasibilityVerdictMarkdown.trim());
  }

  const findingTrustMarkdown = formatCareerExportFindingTrustMarkdownSection(input.exportFindings ?? []);

  if (findingTrustMarkdown.trim().length > 0) {
    sections.push(findingTrustMarkdown.trim());
  }

  if (honesty.blockedForWorkingCareerExport && honesty.measurementFloorBlockedReason !== null) {
    sections.push(`> **Incomplete for career use:** ${honesty.measurementFloorBlockedReason}`);
  }

  return sections.join("\n\n");
}

/** Screen/print-friendly lines derived from the shared career export honesty block. */
export function formatCareerExportHonestyPlainText(input: CareerExportCoverageHonestyInput): string {
  return formatCareerExportHonestyMarkdown(input)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function resolveCareerExportBlockedReason(
  input: CareerExportCoverageHonestyInput,
): string | null {
  const verdict = evaluateCareerArtifactHonesty({
    ...input,
    artifactKind: "export",
    transparencyTrail: input.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null,
  });

  if (verdict.canRender) {
    return null;
  }

  return verdict.blockedReasons[0] ?? null;
}

/** Re-export ADR 0078 entry point — prefer this over direct coverage-honesty imports on new surfaces. */
export {
  evaluateCareerArtifactHonesty,
  type CareerArtifactHonestyInput,
  type CareerArtifactHonestyVerdict,
  type CareerArtifactKind,
} from "@/lib/career-artifact/career-artifact-honesty";
