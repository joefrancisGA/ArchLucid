import {
  formatInsightDensityMeasurementFloorBlockedReason,
  formatInsightDensityMeasurementFloorPresentation,
  type InsightDensityMeasurementFloorPresentation,
} from "@/lib/quality/insight-density-measurement-floor";
import { formatPreCommitGateDisabledCareerBlockedReason } from "@/lib/governance/pre-commit-gate-career-honesty";
import { formatSponsorReviewCoverageHonestyMarkdown } from "@/lib/sponsor/sponsor-review-coverage-honesty";
import type { SponsorReviewCoverageHonestyInputs } from "@/lib/sponsor/sponsor-review-coverage-honesty";

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
  const measurementFloor = formatInsightDensityMeasurementFloorPresentation(input.enginesSucceeded ?? null);
  const measurementFloorBlockedReason = formatInsightDensityMeasurementFloorBlockedReason(
    input.enginesSucceeded ?? null,
    input.catalogAdvisoryEngineFailureCount ?? 0,
  );
  const preCommitGateBlockedReason = formatPreCommitGateDisabledCareerBlockedReason(
    input.preCommitGateEnabled,
  );
  const workingCareerExportBlockedReason =
    preCommitGateBlockedReason ?? measurementFloorBlockedReason;
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
): string {
  const presentation = formatInsightDensityMeasurementFloorPresentation(enginesSucceeded);

  return `## Measurement floor\n\n${presentation.line}\n`;
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

/** Shared markdown honesty block for sponsor PDF, ADR, print, and manifest exports (PC-13). */
export function formatCareerExportHonestyMarkdown(input: CareerExportCoverageHonestyInput): string {
  const honesty = resolveCareerExportCoverageHonesty(input);
  const sections: string[] = [formatCareerExportMeasurementFloorMarkdown(input.enginesSucceeded ?? null).trim()];

  const classificationMarkdown = formatCareerExportClassificationBandMarkdown(input.classificationCounts);

  if (classificationMarkdown.trim().length > 0) {
    sections.push(classificationMarkdown.trim());
  }

  if (honesty.sponsorHonestyMarkdown.trim().length > 0) {
    sections.push(honesty.sponsorHonestyMarkdown.trim());
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
  const honesty = resolveCareerExportCoverageHonesty(input);

  if (!honesty.blockedForWorkingCareerExport) {
    return null;
  }

  return honesty.measurementFloorBlockedReason;
}
