export type PreFinalizeChecklistItemStatus = "Clear" | "Advisory" | "Blocking";

export type PreFinalizeChecklistItem = {
  readonly itemId: string;
  readonly title: string;
  readonly detail?: string | null;
  readonly status: PreFinalizeChecklistItemStatus;
  readonly count: number;
};

export type PreFinalizeChecklistResult = {
  readonly runId: string;
  readonly readyToFinalize: boolean;
  readonly items: readonly PreFinalizeChecklistItem[];
  readonly advisoryCount: number;
  readonly blockingCount: number;
};
