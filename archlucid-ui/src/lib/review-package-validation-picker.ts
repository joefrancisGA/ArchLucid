import type { RunSummary } from "@/types/authority";

import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { formatRecurrenceScheduleUtcLabel } from "@/lib/recurrence-schedule-utc-format";
import type { ReplayValidationOutcome } from "@/lib/replay-validation-workflow";
import { replayValidationOutcomeLabel } from "@/lib/replay-validation-workflow";

export type ReviewPackageValidationRow = {
  readonly run: RunSummary;
  readonly architectureName: string;
  readonly reviewName: string;
  readonly finalizedDateLabel: string;
  readonly ownerLabel: string;
  readonly statusLabel: string;
  readonly lastValidationLabel: string;
};

export function reviewPackageArchitectureName(run: RunSummary): string {
  const projectId = run.projectId?.trim() ?? "";

  if (projectId.length > 0 && projectId.toLowerCase() !== "default") {
    return projectId;
  }

  const description = run.description?.trim() ?? "";

  if (description.length > 0 && description.toLowerCase() !== run.runId.trim().toLowerCase()) {
    return description;
  }

  return "Architecture review";
}

export function reviewPackageStatusLabel(run: RunSummary): string {
  if (run.hasGoldenManifest === true) {
    return "Finalized";
  }

  return "In progress";
}

export function reviewPackageFinalizedDateLabel(run: RunSummary): string {
  if (run.hasGoldenManifest !== true) {
    return " — ";
  }

  return formatRecurrenceScheduleUtcLabel(run.createdUtc);
}

export function reviewPackageOwnerLabel(run: RunSummary): string {
  void run;

  return " — ";
}

export function toReviewPackageValidationRow(
  run: RunSummary,
  lastValidationLabel = " — ",
): ReviewPackageValidationRow {
  return {
    run,
    architectureName: reviewPackageArchitectureName(run),
    reviewName: buyerFacingReviewTitleFromSummary(run),
    finalizedDateLabel: reviewPackageFinalizedDateLabel(run),
    ownerLabel: reviewPackageOwnerLabel(run),
    statusLabel: reviewPackageStatusLabel(run),
    lastValidationLabel,
  };
}

export function matchesReviewPackageValidationSearch(row: ReviewPackageValidationRow, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  return (
    row.architectureName.toLowerCase().includes(normalized) ||
    row.reviewName.toLowerCase().includes(normalized) ||
    row.ownerLabel.toLowerCase().includes(normalized) ||
    row.run.runId.toLowerCase().includes(normalized) ||
    (row.run.displayName ?? "").toLowerCase().includes(normalized) ||
    (row.run.description ?? "").toLowerCase().includes(normalized) ||
    row.run.projectId.toLowerCase().includes(normalized)
  );
}

export function formatLastValidationOutcomeLabel(outcome: ReplayValidationOutcome | null): string {
  if (outcome === null) {
    return " — ";
  }

  return replayValidationOutcomeLabel(outcome);
}
