"use client";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";

/** TB-2151 — prominent pre-intake specimen preview only before the first committed review. */
export function useReviewsNewSpecimenPreviewPresentation(): {
  readonly showProminentSection: boolean;
  readonly showHeaderLinks: boolean;
} {
  const commitQuery = useCorePilotCommitContextQuery();

  if (commitQuery.isPending || commitQuery.isError) {
    return { showProminentSection: false, showHeaderLinks: false };
  }

  const isReturningTenant = commitQuery.data.hasCommittedManifest === true;

  return {
    showProminentSection: !isReturningTenant,
    showHeaderLinks: isReturningTenant,
  };
}
