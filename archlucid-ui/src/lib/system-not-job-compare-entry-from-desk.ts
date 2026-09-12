import { architectureNestedComparePath } from "@/lib/architecture/architecture-routes";
import {
  resolveArchitectureCompareSiblingDefaults,
  type ArchitectureCompareSiblingDefaults,
} from "@/lib/architecture/resolve-architecture-compare-defaults";
import { compareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { comparePageHrefOnBase } from "@/lib/resolve-working-desk-tool-href";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_COMPARE_ENTRY_FROM_DESK_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_COMPARE_ENTRY_FROM_DESK_OWNER = "SN-027" as const;

export const ARCHITECTURE_DESK_COMPARE_DISABLED_REASON =
  "Compare two reviews of this architecture after at least one sealed review exists." as const;

export type ResolveArchitectureDeskCompareBaseRunIdInput = {
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly latestReviewId?: string | null;
  readonly selectedChildRunId?: string | null;
};

/** SN-027 — selected child review wins; else latest Career seal; else newest child review. */
export function resolveArchitectureDeskCompareBaseRunId(
  input: ResolveArchitectureDeskCompareBaseRunIdInput,
): string | null {
  const reviews = input.reviews;

  if (reviews.length === 0) {
    return null;
  }

  const selectedChildRunId = input.selectedChildRunId?.trim() ?? "";

  if (
    selectedChildRunId.length > 0
    && reviews.some((review) => review.runId === selectedChildRunId)
  ) {
    return selectedChildRunId;
  }

  const latestReviewId = input.latestReviewId?.trim() ?? "";

  if (
    latestReviewId.length > 0
    && reviews.some((review) => review.runId === latestReviewId)
  ) {
    return latestReviewId;
  }

  const sortedReviews = [...reviews].sort((left, right) =>
    right.createdUtc.localeCompare(left.createdUtc),
  );

  return sortedReviews[0]?.runId ?? null;
}

export type ResolveArchitectureDeskCompareHrefInput = ResolveArchitectureDeskCompareBaseRunIdInput & {
  readonly architectureId: string;
  readonly workingMode: boolean;
};

export type ArchitectureDeskCompareHrefResolution =
  | { readonly kind: "href"; readonly href: string }
  | { readonly kind: "disabled"; readonly reason: string };

function resolveSiblingPair(input: {
  readonly architectureId: string;
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly baseRunId: string;
}): ArchitectureCompareSiblingDefaults | null {
  return resolveArchitectureCompareSiblingDefaults({
    architectureId: input.architectureId,
    reviews: input.reviews,
    baseRunId: input.baseRunId,
  });
}

/** Working desk opens nested Compare with base prefill; Guided keeps peer Compare (CA-30). */
export function resolveArchitectureDeskCompareHref(
  input: ResolveArchitectureDeskCompareHrefInput,
): ArchitectureDeskCompareHrefResolution {
  const architectureId = input.architectureId.trim();
  const baseRunId = resolveArchitectureDeskCompareBaseRunId(input);

  if (architectureId.length === 0 || baseRunId === null) {
    return { kind: "disabled", reason: ARCHITECTURE_DESK_COMPARE_DISABLED_REASON };
  }

  const siblingDefaults = resolveSiblingPair({
    architectureId,
    reviews: input.reviews,
    baseRunId,
  });

  if (input.workingMode) {
    const nestedBase = architectureNestedComparePath(architectureId);

    if (siblingDefaults !== null) {
      return {
        kind: "href",
        href: comparePageHrefOnBase(
          nestedBase,
          siblingDefaults.priorRunId,
          siblingDefaults.laterRunId,
        ),
      };
    }

    return {
      kind: "href",
      href: comparePageHrefOnBase(nestedBase, baseRunId, null),
    };
  }

  if (siblingDefaults === null) {
    return { kind: "disabled", reason: ARCHITECTURE_DESK_COMPARE_DISABLED_REASON };
  }

  return {
    kind: "href",
    href: compareTwoReviewsHref({
      priorRunId: siblingDefaults.priorRunId,
      laterRunId: siblingDefaults.laterRunId,
      architectureId,
    }),
  };
}
