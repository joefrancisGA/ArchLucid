import {
  ARCHITECTURES_NEW_PATH,
  startReviewFromArchitectureNestedHref,
} from "@/lib/architecture/architecture-routes";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_START_REVIEW_FROM_DESK_ONLY_WORKING_DOC_ANCHOR =
  "docs/architecture/adrs/0077-working-architecture-is-the-locator.md" as const;

export const SYSTEM_NOT_JOB_START_REVIEW_FROM_DESK_ONLY_WORKING_OWNER = "SN-019" as const;

export type ResolveWorkingCreateStartHrefInput = {
  readonly lastOpenArchitectureId?: string | null;
  readonly inFlightParentArchitectureId?: string | null;
};

export type ResolveWorkingCreateStartHrefReason =
  | "nested-under-open-architecture"
  | "portfolio-new";

export type ResolveWorkingCreateStartHrefResult = {
  readonly href: string;
  readonly reason: ResolveWorkingCreateStartHrefReason;
};

function trimmedArchitectureId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/**
 * SN-019 / ADR 0077 — Working create (Alt+N, New review) parents under the open architecture.
 * Bare `/architecture/reviews/new` redirect keeps {@link resolveWorkingStartHref} for desk resume.
 */
export function resolveWorkingCreateStartHref(
  input: ResolveWorkingCreateStartHrefInput,
): ResolveWorkingCreateStartHrefResult {
  const architectureId =
    trimmedArchitectureId(input.lastOpenArchitectureId)
    ?? trimmedArchitectureId(input.inFlightParentArchitectureId);

  if (architectureId !== null) {
    return {
      href: startReviewFromArchitectureNestedHref(architectureId),
      reason: "nested-under-open-architecture",
    };
  }

  return {
    href: ARCHITECTURES_NEW_PATH,
    reason: "portfolio-new",
  };
}
