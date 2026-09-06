import {
  formatInsightDensityMeasurementFloorBlockedReason,
  formatInsightDensityMeasurementFloorPresentation,
  type InsightDensityMeasurementFloorPresentation,
} from "@/lib/quality/insight-density-measurement-floor";
import { formatSponsorReviewCoverageHonestyMarkdown } from "@/lib/sponsor/sponsor-review-coverage-honesty";
import type { SponsorReviewCoverageHonestyInputs } from "@/lib/sponsor/sponsor-review-coverage-honesty";

export type CareerExportCoverageHonestyInput = SponsorReviewCoverageHonestyInputs & {
  readonly enginesSucceeded?: number | null;
  readonly workingDesk?: boolean;
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
  );
  const sponsorHonestyMarkdown = formatSponsorReviewCoverageHonestyMarkdown(input);
  const blockedForWorkingCareerExport =
    input.workingDesk === true && measurementFloorBlockedReason !== null;

  return {
    measurementFloor,
    measurementFloorBlockedReason,
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
