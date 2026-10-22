import type { DiffItem } from "@/types/authority-manifest";

export type ArchitectureSealDeltaResponse = {
  readonly architectureId: string;
  readonly hasPriorSeal: boolean;
  readonly latestSealedManifestId?: string | null;
  readonly latestSealedReviewRunId?: string | null;
  readonly currentDraftId?: string | null;
  readonly diffs: readonly DiffItem[];
  readonly honestyCopy: string;
  readonly emptyStateCopy?: string | null;
};
