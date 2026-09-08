import type { components } from "@/lib/openapi-schemas";

export type PreFinalizeChecklistItemStatus = components["schemas"]["PreFinalizeChecklistItemStatus"];

type PreFinalizeChecklistItemSchema = components["schemas"]["PreFinalizeChecklistItem"];

export type PreFinalizeChecklistItem = PreFinalizeChecklistItemSchema &
  Required<Pick<PreFinalizeChecklistItemSchema, "itemId" | "title" | "status" | "count">>;

type PreFinalizeChecklistResultSchema = components["schemas"]["PreFinalizeChecklistResult"];

export type PreFinalizeChecklistResult = Omit<PreFinalizeChecklistResultSchema, "items"> &
  Required<
    Pick<
      PreFinalizeChecklistResultSchema,
      "runId" | "readyToFinalize" | "advisoryCount" | "blockingCount" | "preCommitGateEnabled"
    >
  > & {
    items: PreFinalizeChecklistItem[];
  };
