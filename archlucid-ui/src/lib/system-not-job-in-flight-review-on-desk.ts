import { resolveSystemNotJobDeskSealedChildReviewHref } from "@/lib/system-not-job-sealed-child-not-second-desk";
import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import {
  buildInFlightDeskHref,
  collectInFlightReviewRunIds,
  filterInFlightOperationsForArchitecture,
  mapInFlightOperationsToDeskRows,
  type InFlightDeskRow,
} from "@/lib/operations/map-in-flight-desk-rows";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_OWNER = "SN-030" as const;

/** SN-030 surfaces — desk child rows and background-wait band (PC-08; not a stay-on-page hero). */
export const SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_SURFACES: readonly string[] = [
  "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskReviewsTable.tsx",
  "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskInFlightSection.tsx",
  "archlucid-ui/src/components/operations/InFlightAnalysisDeskList.tsx",
];

export const SYSTEM_NOT_JOB_DESK_CHILD_REVIEW_IN_FLIGHT_STATUS_LABEL = "In progress" as const;

export const SYSTEM_NOT_JOB_DESK_IN_FLIGHT_BACKGROUND_WAIT_HELPER =
  "Analysis runs in the background — open Activity on the child review; cancel still asks for confirmation." as const;

export type ResolveSystemNotJobDeskChildReviewHrefInput = {
  readonly runId: string;
  readonly architectureId: string;
  readonly inFlightOperation: TrackedInFlightOperation | null;
};

/** Child review link — Activity tab while in-flight; nested desk job when sealed (PC-08 / SN-018). */
export function resolveSystemNotJobDeskChildReviewHref(
  input: ResolveSystemNotJobDeskChildReviewHrefInput,
): string {
  if (input.inFlightOperation !== null) {
    return buildInFlightDeskHref(input.inFlightOperation);
  }

  return resolveSystemNotJobDeskSealedChildReviewHref(input.runId, input.architectureId);
}

export function findSystemNotJobDeskInFlightOperationForReview(
  operations: readonly TrackedInFlightOperation[],
  architectureId: string,
  runId: string,
): TrackedInFlightOperation | null {
  const normalizedRunId = runId.trim();

  if (normalizedRunId.length === 0) {
    return null;
  }

  const scoped = filterInFlightOperationsForArchitecture(operations, architectureId);

  return (
    scoped.find((operation) => (operation.runId?.trim() ?? "") === normalizedRunId) ?? null
  );
}

export function buildSystemNotJobDeskInFlightReviewRunIds(
  operations: readonly TrackedInFlightOperation[],
  architectureId: string,
): ReadonlySet<string> {
  return collectInFlightReviewRunIds(
    filterInFlightOperationsForArchitecture(operations, architectureId),
  );
}

export function buildSystemNotJobDeskInFlightDeskRows(
  operations: readonly TrackedInFlightOperation[],
  architectureId: string,
): readonly InFlightDeskRow[] {
  return mapInFlightOperationsToDeskRows(
    filterInFlightOperationsForArchitecture(operations, architectureId),
  );
}

export function resolveSystemNotJobDeskChildReviewStatusLabel(
  inFlightOperation: TrackedInFlightOperation | null,
): string | null {
  if (inFlightOperation === null) {
    return null;
  }

  const stepLabel = inFlightOperation.stepLabel.trim();

  if (stepLabel.length > 0) {
    return stepLabel;
  }

  return SYSTEM_NOT_JOB_DESK_CHILD_REVIEW_IN_FLIGHT_STATUS_LABEL;
}

export type SortSystemNotJobDeskChildReviewsInput = {
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly inFlightRunIds: ReadonlySet<string>;
};

/** In-flight child reviews surface first on the architecture desk child table. */
export function sortSystemNotJobDeskChildReviews(
  input: SortSystemNotJobDeskChildReviewsInput,
): ArchitectureIdentityChildReviewSummary[] {
  return [...input.reviews].sort((left, right) => {
    const leftInFlight = input.inFlightRunIds.has(left.runId) ? 0 : 1;
    const rightInFlight = input.inFlightRunIds.has(right.runId) ? 0 : 1;

    if (leftInFlight !== rightInFlight) {
      return leftInFlight - rightInFlight;
    }

    return right.createdUtc.localeCompare(left.createdUtc);
  });
}
