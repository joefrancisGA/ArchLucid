"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  resolveAcceleratorChooserPrerequisitePresentation,
  type AcceleratorChooserPrerequisitePresentation,
} from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";

export type AcceleratorChooserPrerequisitePresentationWithRetry = AcceleratorChooserPrerequisitePresentation & {
  readonly retry: () => void;
};

/** Live tenant signed-review-record prerequisite for `/help/accelerator-chooser`. */
export function useAcceleratorChooserPrerequisitePresentation(): AcceleratorChooserPrerequisitePresentationWithRetry {
  const queryClient = useQueryClient();
  const commitQuery = useCorePilotCommitContextQuery();
  const committedRunId = commitQuery.data?.firstCommittedRunId ?? null;

  const manifestQuery = useQuery({
    queryKey: [...operatorQueryKeys.corePilotCommitContext, "prerequisite-manifest", committedRunId],
    queryFn: () => resolveGoldenManifestIdForRun(committedRunId!),
    enabled: committedRunId !== null && commitQuery.data?.hasCommittedManifest === true,
  });

  const presentation = resolveAcceleratorChooserPrerequisitePresentation({
    commitQueryPending: commitQuery.isPending,
    commitQueryError: commitQuery.isError,
    commitContext: commitQuery.data,
    manifestQueryPending:
      committedRunId !== null
      && commitQuery.data?.hasCommittedManifest === true
      && manifestQuery.isPending,
    manifestId: manifestQuery.data,
  });

  const retry = (): void => {
    void commitQuery.refetch();

    if (committedRunId !== null) {
      void manifestQuery.refetch();
    }
  };

  return { ...presentation, retry };
}
