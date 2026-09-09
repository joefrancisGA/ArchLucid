"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { getDraftRequest, submitDraftRequest } from "@/lib/api/draft-intake-api";
import { architectureDraftIntakeMutationBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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
  readonly errorMessage: string | null;
  readonly executeBranch: (response: BranchDraftResponse) => Promise<void>;
};

/** Branch submit + navigate to in-flight branch with parent compare deep link (LS-06 / R12). */
export function useReviewPackageWhatIfExecute(baseRunId: string): UseReviewPackageWhatIfExecuteResult {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeBranch = useCallback(
    async (response: BranchDraftResponse) => {
      if (busy) {
        return;
      }

      setBusy(true);
      setErrorMessage(null);

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
      } catch (error: unknown) {
        const failure = toApiLoadFailure(error);
        setErrorMessage(
          architectureDraftIntakeMutationBlockedReason(failure)
            ?? (error instanceof Error ? error.message : "What-if branch submit failed."),
        );
      } finally {
        setBusy(false);
      }
    },
    [baseRunId, busy, router],
  );

  return { busy, errorMessage, executeBranch };
}
