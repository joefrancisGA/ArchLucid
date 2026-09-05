"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { getDraftRequest, submitDraftRequest } from "@/lib/api/draft-intake-api";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { runDetailHrefWithParentRun } from "@/lib/draft-branch-compare-navigation";
import { invalidateOperatorHomeRunsCaches } from "@/lib/operator/operator-query-invalidation";
import { trackReviewPipelineInFlight } from "@/lib/operations/review-pipeline-in-flight";
import type { BranchDraftResponse } from "@/types/draft-intake";

export type UseReviewPackageWhatIfExecuteResult = {
  readonly busy: boolean;
  readonly executeBranch: (response: BranchDraftResponse) => Promise<void>;
};

/** Branch submit + navigate to in-flight branch with parent compare deep link (LS-06 / R12). */
export function useReviewPackageWhatIfExecute(baseRunId: string): UseReviewPackageWhatIfExecuteResult {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const executeBranch = useCallback(
    async (response: BranchDraftResponse) => {
      if (busy) {
        return;
      }

      setBusy(true);

      try {
        const branchDraftId = response.branch.draftId;
        const draftBeforeSubmit = await getDraftRequest(branchDraftId);
        const result = await submitDraftRequest(branchDraftId, draftBeforeSubmit.updatedUtc);
        const submittedDraft = await getDraftRequest(branchDraftId);

        upsertArchitectureDraftRegistryEntry(
          buildArchitectureDraftRegistryEntry(submittedDraft, { linkedReviewId: result.runId }),
        );
        await invalidateOperatorHomeRunsCaches();
        trackReviewPipelineInFlight(result.runId);
        router.push(runDetailHrefWithParentRun(result.runId, baseRunId));
      } finally {
        setBusy(false);
      }
    },
    [baseRunId, busy, router],
  );

  return { busy, executeBranch };
}
