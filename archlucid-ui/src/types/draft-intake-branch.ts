import type { DraftBranchOverrideKind } from "@/types/draft-intake-status";
import type { DraftRequestResponse } from "@/types/draft-intake-workflow";

export type BranchDraftRequest = {
  overrideKind: DraftBranchOverrideKind;
  overrideKey?: string;
  overrideValue: string;
};

export type BranchDraftResponse = {
  parentDraftId: string;
  parentSpawnedRunId?: string;
  branch: DraftRequestResponse;
};

export type DraftBranchQuotaResponse = {
  draftId: string;
  existingBranchCount: number;
  maxBranchesPerParent: number;
  remainingBranches: number;
  canBranch: boolean;
  estimatedBranchRunCostUsd: number;
};
