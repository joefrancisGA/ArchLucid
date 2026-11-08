import type { RunSummary } from "@/types/authority";

import {
  ACTION_ACTOR_UNAVAILABLE,
  formatActionActorName,
} from "@/lib/action-actor-display";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
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

/** Shown when no package owner can be resolved for a review row. */
export const REVIEW_PACKAGE_OWNER_UNAVAILABLE = "Owner was not stored.";

/** Shown when a validation replay outcome was not stored for the package row. */
export const REVIEW_PACKAGE_VALIDATION_OUTCOME_NOT_STORED = "Validation outcome was not stored." as const;

/** Legacy draft-registry placeholder for the signed-in operator — replaced with username when known. */
export const REVIEW_PACKAGE_SELF_OWNER_PLACEHOLDER = "You";

export type ReviewPackageOwnerResolutionContext = {
  readonly currentUserLabel?: string | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
};

type RunSummaryWithGovernanceOwner = RunSummary & {
  readonly operatorGovernanceDecisionByUserId?: string | null;
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

  return "Architecture name was not stored.";
}

export function reviewPackageStatusLabel(run: RunSummary): string {
  if (run.hasGoldenManifest === true) {
    return "Finalized";
  }

  return "In progress";
}

/** @deprecated Prefer {@link reviewPackageCreatedDateLabel} and {@link reviewPackageFinalizedTimeLabel}. */
export function reviewPackageFinalizedDateLabel(run: RunSummary): string {
  return reviewPackageCreatedDateLabel(run);
}

export function reviewPackageCreatedDateLabel(run: RunSummary): string {
  const created = run.createdUtc?.trim() ?? "";

  if (created.length === 0) {
    return "Created time was not stored.";
  }

  return formatRecurrenceScheduleUtcLabel(run.createdUtc);
}

export function reviewPackageFinalizedTimeLabel(run: RunSummary): string {
  const finalized = run.completedUtc?.trim() ?? "";

  if (finalized.length > 0) {
    return formatRecurrenceScheduleUtcLabel(run.completedUtc!);
  }

  return "Finalized time was not stored.";
}

export function lookupArchitectureDraftOwnerLabel(
  runId: string,
  entries: readonly ArchitectureDraftRegistryEntry[] | undefined,
): string | null {
  if (entries === undefined || entries.length === 0) {
    return null;
  }

  const normalizedRunId = canonicalizeDemoRunId(runId);

  for (const entry of entries) {
    const linkedReviewId = entry.linkedReviewId?.trim() ?? "";

    if (linkedReviewId.length === 0) {
      continue;
    }

    if (canonicalizeDemoRunId(linkedReviewId) !== normalizedRunId) {
      continue;
    }

    const ownerLabel = entry.ownerLabel.trim();

    if (ownerLabel.length > 0) {
      return ownerLabel;
    }
  }

  return null;
}

/** Parent architecture identity for a linked review when the architecture draft registry knows it (AO-26 / AO-08). */
export function lookupArchitectureDraftParentArchitectureId(
  runId: string,
  entries: readonly ArchitectureDraftRegistryEntry[] | undefined,
): string | null {
  if (entries === undefined || entries.length === 0) {
    return null;
  }

  const normalizedRunId = canonicalizeDemoRunId(runId);

  for (const entry of entries) {
    const linkedReviewId = entry.linkedReviewId?.trim() ?? "";

    if (linkedReviewId.length === 0) {
      continue;
    }

    if (canonicalizeDemoRunId(linkedReviewId) !== normalizedRunId) {
      continue;
    }

    const parentArchitectureId = entry.parentArchitectureId?.trim() ?? "";

    if (parentArchitectureId.length > 0) {
      return parentArchitectureId;
    }
  }

  return null;
}

function governanceDecisionOwnerLabel(run: RunSummary): string | null {
  const decisionBy = (run as RunSummaryWithGovernanceOwner).operatorGovernanceDecisionByUserId?.trim() ?? "";

  if (decisionBy.length === 0) {
    return null;
  }

  const formatted = formatActionActorName(decisionBy);

  if (formatted === ACTION_ACTOR_UNAVAILABLE) {
    return null;
  }

  return formatted;
}

function normalizeResolvedOwnerLabel(
  ownerLabel: string,
  currentUserLabel: string | null | undefined,
): string {
  if (ownerLabel.trim().toLowerCase() !== REVIEW_PACKAGE_SELF_OWNER_PLACEHOLDER.toLowerCase()) {
    return ownerLabel;
  }

  const formatted = formatActionActorName(currentUserLabel);

  if (formatted === ACTION_ACTOR_UNAVAILABLE) {
    return "Owner was not stored.";
  }

  return formatted;
}

/** Resolves the review package owner shown in reviews hub and validation pickers. */
export function reviewPackageOwnerLabel(
  run: RunSummary,
  context: ReviewPackageOwnerResolutionContext = {},
): string {
  const demoOwner = buyerDemoPackageCardMeta(run.runId)?.packageOwner?.trim() ?? "";

  if (demoOwner.length > 0) {
    return demoOwner;
  }

  const draftOwner = lookupArchitectureDraftOwnerLabel(run.runId, context.draftRegistryEntries);

  if (draftOwner !== null) {
    return normalizeResolvedOwnerLabel(draftOwner, context.currentUserLabel);
  }

  const governanceOwner = governanceDecisionOwnerLabel(run);

  if (governanceOwner !== null) {
    return governanceOwner;
  }

  return REVIEW_PACKAGE_OWNER_UNAVAILABLE;
}

export function toReviewPackageValidationRow(
  run: RunSummary,
  lastValidationLabel: string = REVIEW_PACKAGE_VALIDATION_OUTCOME_NOT_STORED,
  ownerContext: ReviewPackageOwnerResolutionContext = {},
): ReviewPackageValidationRow {
  return {
    run,
    architectureName: reviewPackageArchitectureName(run),
    reviewName: buyerFacingReviewTitleFromSummary(run),
    finalizedDateLabel: reviewPackageFinalizedDateLabel(run),
    ownerLabel: reviewPackageOwnerLabel(run, ownerContext),
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
    return REVIEW_PACKAGE_VALIDATION_OUTCOME_NOT_STORED;
  }

  return replayValidationOutcomeLabel(outcome);
}
