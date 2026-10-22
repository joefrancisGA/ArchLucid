import type { DraftRequestResponse } from "@/types/draft-intake";

export type CloneSnapshotDraftResponse = {
  readonly sourceDraftId: string;
  readonly sourceSpawnedRunId?: string | null;
  readonly clone: DraftRequestResponse;
};
