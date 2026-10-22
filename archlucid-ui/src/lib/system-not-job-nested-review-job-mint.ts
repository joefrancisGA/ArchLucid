import {
  parseArchitectureNestedDeskArchitectureId,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_NESTED_REVIEW_JOB_MINT_DOC_ANCHOR =
  "docs/architecture/SYSTEM_DESK_PEER_MINT_INVENTORY.md" as const;

export type SystemNotJobNestedReviewJobMintRow = {
  readonly relativePath: string;
  readonly surface: string;
  readonly ownerPrompt: string;
};

/**
 * SN-010 shrink-only inventory: Working nested surfaces that mint review hrefs
 * when architecture id is known (SY-80 ratchet already blocks inbox; this shrinks peer leftovers).
 */
export const SYSTEM_NOT_JOB_NESTED_REVIEW_JOB_MINT_ROWS: readonly SystemNotJobNestedReviewJobMintRow[] = [
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/insights/impact-preview/_sections/EvolutionReviewPageView.tsx",
    surface: "impact-preview scoped run scope banner Open review",
    ownerPrompt: "SN-010",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/insights/impact-preview/_sections/ImpactPreviewEvidenceBasisSection.tsx",
    surface: "impact-preview evidence basis baseline review link",
    ownerPrompt: "SN-010",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx",
    surface: "compare scope banner Open updated review",
    ownerPrompt: "SN-010",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx",
    surface: "evidence graph open review package link",
    ownerPrompt: "SN-010",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/use-graph-page-control-filters.ts",
    surface: "evidence graph controls review package href",
    ownerPrompt: "SN-010",
  },
] as const;

/** Unlinked legacy reviews keep peer inbox URLs — only nested when architecture id is known. */
export const SYSTEM_NOT_JOB_UNLINKED_REVIEW_PEER_HONESTY =
  "Unlinked reviews without a known architecture id keep the peer /architecture/reviews/{id} href." as const;

export type ResolveSystemNotJobWorkingReviewArchitectureIdInput = {
  readonly pinnedArchitectureId?: string | null;
  readonly pathname?: string | null;
  readonly queryArchitectureId?: string | null;
};

/** Resolves architecture id from nested route segment, pinned desk context, or query param. */
export function resolveSystemNotJobWorkingReviewArchitectureId(
  input: ResolveSystemNotJobWorkingReviewArchitectureIdInput,
): string | null {
  const pinned = input.pinnedArchitectureId?.trim() ?? "";

  if (pinned.length > 0) {
    return pinned;
  }

  const routeArchitectureId = parseArchitectureNestedDeskArchitectureId(input.pathname ?? "");

  if (routeArchitectureId !== null && routeArchitectureId.length > 0) {
    return routeArchitectureId;
  }

  const queryArchitectureId = input.queryArchitectureId?.trim() ?? "";

  if (queryArchitectureId.length > 0) {
    return queryArchitectureId;
  }

  return null;
}

/** SN-010: nested desk review href when architecture id is known; honest peer fallback when not. */
export function resolveSystemNotJobWorkingReviewOpenHref(
  reviewId: string,
  architectureId?: string | null,
): string {
  const trimmedReviewId = reviewId.trim();
  const trimmedArchitectureId = architectureId?.trim() ?? "";

  return resolveArchitectureReviewHref(
    trimmedReviewId,
    trimmedArchitectureId.length > 0 ? trimmedArchitectureId : null,
  );
}
