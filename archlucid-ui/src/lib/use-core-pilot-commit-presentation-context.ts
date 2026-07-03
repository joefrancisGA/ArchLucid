"use client";

import { useMemo } from "react";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import type { CorePilotCommitPresentationContext } from "@/lib/core-pilot-step-presentation";

const emptyContext: CorePilotCommitPresentationContext = {
  hasCommittedManifest: false,
  latestCommittedRunId: null,
};

/** Loads tenant commit state for Core Pilot step-5 sample vs finalized review CTAs. */
export function useCorePilotCommitPresentationContext(): CorePilotCommitPresentationContext {
  const query = useCorePilotCommitContextQuery();

  return useMemo((): CorePilotCommitPresentationContext => {
    if (query.isPending || query.isError || query.data === undefined) {
      return emptyContext;
    }

    return {
      hasCommittedManifest: query.data.hasCommittedManifest,
      latestCommittedRunId: query.data.firstCommittedRunId ?? query.data.latestRunId,
    };
  }, [query.isPending, query.isError, query.data]);
}
