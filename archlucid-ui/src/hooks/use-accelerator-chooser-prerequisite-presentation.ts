"use client";

import { useQuery } from "@tanstack/react-query";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  resolveAcceleratorChooserPrerequisitePresentation,
  type AcceleratorChooserPrerequisitePresentation,
} from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";

/** Live tenant signed-review-record prerequisite for `/help/accelerator-chooser`. */
export function useAcceleratorChooserPrerequisitePresentation(): AcceleratorChooserPrerequisitePresentation {
  const commitQuery = useCorePilotCommitContextQuery();
  const committedRunId = commitQuery.data?.firstCommittedRunId ?? null;

  const manifestQuery = useQuery({
    queryKey: [...operatorQueryKeys.corePilotCommitContext, "prerequisite-manifest", committedRunId],
    queryFn: () => resolveGoldenManifestIdForRun(committedRunId!),
    enabled: committedRunId !== null && commitQuery.data?.hasCommittedManifest === true,
  });

  return resolveAcceleratorChooserPrerequisitePresentation({
    commitQueryPending: commitQuery.isPending,
    commitQueryError: commitQuery.isError,
    commitContext: commitQuery.data,
    manifestQueryPending:
      committedRunId !== null
      && commitQuery.data?.hasCommittedManifest === true
      && manifestQuery.isPending,
    manifestId: manifestQuery.data,
  });
}
