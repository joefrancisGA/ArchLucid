import {
  REVIEW_LIFECYCLE_FINALIZED_STATE_LABEL,
  REVIEW_LIFECYCLE_FINALIZE_ACTION_LABEL,
  REVIEW_LIFECYCLE_SEALED_ARTIFACT_LABEL,
  formatFinalizedReviewPackagesOutcome,
} from "@/lib/vocabulary/review-lifecycle-verb-map";

export type ProjectReviewLifecycleForDisplayInput = {
  readonly manifestStatus?: string | null;
  readonly committedRunsInScope?: number | null;
  readonly activeRunsInScope?: number | null;
};

export type ProjectReviewLifecycleForDisplay = {
  readonly manifestStatusLabel: string;
  readonly finalizeActionLabel: string;
  readonly sealedArtifactLabel: string;
  readonly committedRunsInScopeLabel: string | null;
};

function normalizeCount(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value as number));
}

/** TB-2372 — customer chrome projection for lifecycle verbs and manifest status strings. */
export function projectReviewLifecycleForDisplay(
  input: ProjectReviewLifecycleForDisplayInput,
): ProjectReviewLifecycleForDisplay {
  const status = (input.manifestStatus ?? "").trim();
  let manifestStatusLabel = "—";

  if (/^committed$/i.test(status)) {
    manifestStatusLabel = REVIEW_LIFECYCLE_FINALIZED_STATE_LABEL;
  }
  else if (status.length > 0) {
    manifestStatusLabel = status;
  }

  const committedCount = normalizeCount(input.committedRunsInScope);
  const activeCount = normalizeCount(input.activeRunsInScope);
  const committedRunsInScopeLabel =
    input.committedRunsInScope === null || input.committedRunsInScope === undefined
      ? null
      : formatFinalizedReviewPackagesOutcome({
          finalizedCount: committedCount,
          activeCount,
        });

  return {
    manifestStatusLabel,
    finalizeActionLabel: REVIEW_LIFECYCLE_FINALIZE_ACTION_LABEL,
    sealedArtifactLabel: REVIEW_LIFECYCLE_SEALED_ARTIFACT_LABEL,
    committedRunsInScopeLabel,
  };
}
