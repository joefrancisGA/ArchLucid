import {
  architectureIdentityPath,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  resolveArchitectureReviewTabHref,
  resolveReviewWorkspaceArchitectureId,
} from "@/lib/architecture/working-architecture-review-routes";
import { parseArchitectureNestedRoute } from "@/lib/architecture/working-architecture-draft-routes";
import { lookupArchitectureDraftParentArchitectureId } from "@/lib/review-package-validation-picker";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

/** SN-005: spawn-locked draft bookmark/history back — review job first, never writable draft editor. */
export const ARCHITECTURE_SPAWN_LOCKED_DRAFT_BACK_TO_REVIEW_LABEL = "Back to review";

export type ResolveWorkingBackLocatorInput = {
  readonly reviewId: string;
  readonly architectureId?: string | null;
  readonly pathname?: string | null;
  readonly reviewTab?: ReviewDetailTabId | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
};

export type WorkingBackLocator = {
  readonly architectureDeskHref: string | null;
  readonly reviewJobHref: string;
};

function resolveWorkingBackArchitectureId(input: ResolveWorkingBackLocatorInput): string | null {
  const explicit = input.architectureId?.trim() ?? "";

  if (explicit.length > 0) {
    return explicit;
  }

  const fromPathname = resolveReviewWorkspaceArchitectureId(null, input.pathname);

  if (fromPathname !== null) {
    return fromPathname;
  }

  const path = input.pathname?.split("?")[0] ?? "";
  const nestedArchitectureId = parseArchitectureNestedRoute(path)?.architectureId?.trim() ?? "";

  if (nestedArchitectureId.length > 0) {
    return nestedArchitectureId;
  }

  return lookupArchitectureDraftParentArchitectureId(
    input.reviewId,
    input.draftRegistryEntries,
  );
}

/** Working deep pages: child → nested review job → architecture desk (AO-44 / ADR 0077). */
export function resolveWorkingBackLocator(
  input: ResolveWorkingBackLocatorInput,
): WorkingBackLocator {
  const architectureId = resolveWorkingBackArchitectureId(input);
  const reviewTab = input.reviewTab ?? null;
  const reviewJobHref =
    reviewTab !== null
      ? resolveArchitectureReviewTabHref(input.reviewId, reviewTab, architectureId)
      : resolveArchitectureReviewHref(input.reviewId, architectureId);

  return {
    architectureDeskHref: architectureId !== null ? architectureIdentityPath(architectureId) : null,
    reviewJobHref,
  };
}

/** Convenience when callers only need the nested review job (or peer fallback) href. */
export function resolveWorkingBackHref(input: ResolveWorkingBackLocatorInput): string {
  return resolveWorkingBackLocator(input).reviewJobHref;
}

export function resolveWorkingReviewFindingsBackHref(
  input: Omit<ResolveWorkingBackLocatorInput, "reviewTab">,
): string {
  return resolveWorkingBackHref({ ...input, reviewTab: "findings" });
}

export function resolveWorkingReviewPackageBackHref(
  input: Omit<ResolveWorkingBackLocatorInput, "reviewTab">,
): string {
  return resolveWorkingBackHref({ ...input, reviewTab: "review-package" });
}

export type ResolveSpawnLockedDraftBackLocatorInput = {
  readonly linkedReviewId: string;
  readonly parentArchitectureId?: string | null;
};

/** Spawn-locked draft surfaces: nested review job or architecture desk — never the writable draft route. */
export function resolveSpawnLockedDraftBackLocator(
  input: ResolveSpawnLockedDraftBackLocatorInput,
): WorkingBackLocator {
  const linkedReviewId = input.linkedReviewId.trim();
  const architectureId = input.parentArchitectureId?.trim() ?? "";

  return resolveWorkingBackLocator({
    reviewId: linkedReviewId,
    architectureId: architectureId.length > 0 ? architectureId : null,
  });
}

export function resolveSpawnLockedDraftPrimaryBackHref(
  input: ResolveSpawnLockedDraftBackLocatorInput,
): string {
  return resolveSpawnLockedDraftBackLocator(input).reviewJobHref;
}

/**
 * After start-review, intake/history back must not target a writable draft editor when the draft is spawn-locked.
 * Returns null when the draft is still editable.
 */
export function resolveStartReviewSpawnLockedDraftBackLocator(input: {
  readonly linkedReviewId: string | null | undefined;
  readonly parentArchitectureId?: string | null;
}): WorkingBackLocator | null {
  const linkedReviewId = input.linkedReviewId?.trim() ?? "";

  if (linkedReviewId.length === 0) {
    return null;
  }

  return resolveSpawnLockedDraftBackLocator({
    linkedReviewId,
    parentArchitectureId: input.parentArchitectureId,
  });
}

export function resolveStartReviewSpawnLockedDraftBackHref(input: {
  readonly linkedReviewId: string | null | undefined;
  readonly parentArchitectureId?: string | null;
  readonly draftEditorHref: string;
}): string {
  const locator = resolveStartReviewSpawnLockedDraftBackLocator(input);

  if (locator !== null) {
    return locator.reviewJobHref;
  }

  return input.draftEditorHref;
}

/** True when pathname opens a nested draft editor (`/drafts/{draftId}`). */
export function isArchitectureDraftWritableEditorRoutePath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? "";
  const nested = parseArchitectureNestedRoute(path);

  return nested?.childKind === "drafts";
}

/** Guard for SN-005: spawn-locked back hrefs must not reopen the writable draft editor. */
export function assertSpawnLockedDraftBackHrefHonest(
  backHref: string,
  draftEditorHref: string,
): void {
  const normalizedBack = backHref.split("?")[0] ?? "";
  const normalizedDraftEditor = draftEditorHref.split("?")[0] ?? "";

  if (normalizedBack === normalizedDraftEditor) {
    throw new Error("Spawn-locked draft back href must not target the writable draft editor.");
  }

  if (isArchitectureDraftWritableEditorRoutePath(normalizedBack)) {
    throw new Error("Spawn-locked draft back href must target review job or architecture desk.");
  }
}
