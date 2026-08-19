import type { ArchitectureDigest } from "@/types/advisory-scheduling";

/**
 * Column header for digest coverage.
 *
 * Deliberately not "Period": `ArchitectureDigest` carries no calendar bounds
 * (`ArchitectureDigestBuilder` records review refs and counts only), so a
 * "Period" header would promise start/end dates the data cannot supply.
 */
export const DIGEST_COVERAGE_COLUMN_HEADER = "Coverage" as const;

export const DIGEST_COVERAGE_UNSPECIFIED_LABEL = "Period not specified" as const;

export const DIGEST_COVERAGE_UNSPECIFIED_DETAIL =
  "This digest did not record which review it covers." as const;

export const DIGEST_COVERAGE_COMPARED_LABEL = "Change since previous review" as const;

export const DIGEST_COVERAGE_SNAPSHOT_LABEL = "Single review snapshot" as const;

/** Coverage facts for one digest row: headline claim plus the review refs behind it. */
export type DigestPeriodCoverage = {
  readonly label: string;
  readonly detail: string | null;
};

/** Leading segment of a review identifier — what operators quote in handoffs. */
const SHORT_REVIEW_REF_LENGTH = 8;

function shortReviewRef(runId: string | null | undefined): string | null {
  if (runId === null || runId === undefined) {
    return null;
  }

  const trimmed: string = runId.trim();

  if (trimmed === "") {
    return null;
  }

  return trimmed.length <= SHORT_REVIEW_REF_LENGTH ? trimmed : trimmed.slice(0, SHORT_REVIEW_REF_LENGTH);
}

/**
 * Resolves what a digest actually covers from the fields the DTO carries.
 * Falls back to an explicit "not specified" rather than inventing a window.
 */
export function resolveDigestPeriodCoverage(digest: ArchitectureDigest): DigestPeriodCoverage {
  const runRef: string | null = shortReviewRef(digest.runId);
  const comparedRef: string | null = shortReviewRef(digest.comparedToRunId);

  if (comparedRef !== null && runRef !== null) {
    return { label: DIGEST_COVERAGE_COMPARED_LABEL, detail: `${comparedRef} → ${runRef}` };
  }

  if (comparedRef !== null) {
    return { label: DIGEST_COVERAGE_COMPARED_LABEL, detail: `Since review ${comparedRef}` };
  }

  if (runRef !== null) {
    return { label: DIGEST_COVERAGE_SNAPSHOT_LABEL, detail: `Review ${runRef}` };
  }

  return { label: DIGEST_COVERAGE_UNSPECIFIED_LABEL, detail: DIGEST_COVERAGE_UNSPECIFIED_DETAIL };
}
