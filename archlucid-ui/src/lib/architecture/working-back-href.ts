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
