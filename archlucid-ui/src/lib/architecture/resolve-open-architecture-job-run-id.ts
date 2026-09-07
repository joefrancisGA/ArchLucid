import { resolveArchitectureIdentityCurrentDraftState } from "@/lib/architecture/architecture-identity-current-draft";
import { parseArchitectureNestedRoute } from "@/lib/architecture/working-architecture-draft-routes";
import { extractReviewIdFromPathname } from "@/lib/desk-continuity-preference";
import type { ArchitectureIdentityDetail } from "@/types/architecture-identity";

export type ResolveOpenArchitectureJobRunIdInput = {
  readonly pathname: string | null | undefined;
  readonly lastOpenArchitectureId?: string | null;
  readonly lastOpenReviewId?: string | null;
  readonly identity?: ArchitectureIdentityDetail | null;
};

export type ResolveOpenArchitectureJobRunIdResult = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly runId: string | null;
};

function resolveArchitectureIdFromPath(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "";
  const nestedRoute = parseArchitectureNestedRoute(path);

  if (nestedRoute === null) {
    return null;
  }

  const architectureId = nestedRoute.architectureId.trim();

  return architectureId.length > 0 ? architectureId : null;
}

function resolveRunIdFromIdentity(identity: ArchitectureIdentityDetail): string | null {
  const latestReviewId = identity.latestReviewId?.trim() ?? "";

  if (latestReviewId.length > 0) {
    return latestReviewId;
  }

  const newestReview = identity.reviews[0];

  if (newestReview !== undefined) {
    return newestReview.runId;
  }

  const draftState = resolveArchitectureIdentityCurrentDraftState(
    identity.drafts,
    identity.currentDraftId,
    identity.latestReviewId,
  );

  if (draftState.kind === "spawn-locked" && draftState.linkedReviewId !== null) {
    return draftState.linkedReviewId;
  }

  return null;
}

/** Working Ask / graph bind: architecture identity → current review job (AO-30 / AO-31). */
export function resolveOpenArchitectureJobRunId(
  input: ResolveOpenArchitectureJobRunIdInput,
): ResolveOpenArchitectureJobRunIdResult | null {
  const architectureIdFromPath = resolveArchitectureIdFromPath(input.pathname ?? "");
  const cachedArchitectureId = input.lastOpenArchitectureId?.trim() ?? "";
  const architectureId =
    architectureIdFromPath ?? (cachedArchitectureId.length > 0 ? cachedArchitectureId : "");

  if (architectureId.length === 0) {
    return null;
  }

  const identity = input.identity;
  const displayName = identity?.displayName?.trim() ?? "Architecture";
  const fromPath = extractReviewIdFromPathname(input.pathname ?? "");

  if (fromPath !== null) {
    return { architectureId, displayName, runId: fromPath };
  }

  if (identity !== null && identity !== undefined) {
    const runIdFromIdentity = resolveRunIdFromIdentity(identity);

    if (runIdFromIdentity !== null) {
      return { architectureId, displayName, runId: runIdFromIdentity };
    }
  }

  const lastOpenReviewId = input.lastOpenReviewId?.trim() ?? "";

  if (lastOpenReviewId.length > 0) {
    return { architectureId, displayName, runId: lastOpenReviewId };
  }

  return { architectureId, displayName, runId: null };
}
