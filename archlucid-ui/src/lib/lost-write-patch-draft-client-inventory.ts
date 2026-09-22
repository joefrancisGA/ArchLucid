/**
 * Shrink-only inventory of production clients that PATCH a Drafting architecture draft (LW-002).
 * casPolicy "omit" is a last-write-wins hole after ADR 0088 — new omit rows need a documented exception.
 */

export type LostWritePatchDraftCasPolicy = "token" | "forceOverwrite" | "omit";

export type LostWritePatchDraftClientRow = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly casPolicy: LostWritePatchDraftCasPolicy;
  readonly notes: string;
};

export const LOST_WRITE_PATCH_DRAFT_CLIENTS: readonly LostWritePatchDraftClientRow[] = [
  {
    id: "ui-online-persist",
    sourceRoots: ["hooks/use-architecture-draft-autosave-persist.ts"],
    casPolicy: "token",
    notes: "Online persistDraft sends expectedUpdatedUtc from serverUpdatedUtcRef or GET updatedUtc (LW-032).",
  },
  {
    id: "ui-offline-replay",
    sourceRoots: [
      "hooks/use-architecture-draft-autosave-persist.ts",
      "lib/architecture/architecture-draft-offline-queue-replay.ts",
    ],
    casPolicy: "token",
    notes: "replayOfflineQueue / replayArchitectureDraftOfflineQueue must send the v2 entry token; v1 leftovers conflict (LW-036–042).",
  },
  {
    id: "cli-draft-new-admit",
    sourceRoots: ["ArchLucid.Cli/Commands/DraftNewCommandAdmitStage.cs"],
    casPolicy: "token",
    notes: "DraftNewCommandAdmitStage copies created.Value.UpdatedUtc onto PatchDraftRequest (LW-023).",
  },
  {
    id: "guided-intake-create",
    sourceRoots: ["app/(operator)/architecture/reviews/new/use-guided-intake-draft-create.ts"],
    casPolicy: "token",
    notes: "Uses patchDraftRequestRequiringCas after create/GET.",
  },
  {
    id: "guided-intake-admit",
    sourceRoots: ["app/(operator)/architecture/reviews/new/use-guided-intake-draft-admit.ts"],
    casPolicy: "token",
    notes: "Admit PATCH sends expectedUpdatedUtc from create/GET.",
  },
  {
    id: "start-review-scope-patch",
    sourceRoots: ["hooks/use-architecture-draft-start-review.ts"],
    casPolicy: "token",
    notes: "Scope confirmation and start-review intent PATCH send lastSavedUtc / draft.updatedUtc.",
  },
] as const;

/** Production omit rows — shrink-only. Growth requires a documented exception id. */
export const LOST_WRITE_PATCH_DRAFT_OMIT_EXCEPTION_IDS: readonly string[] = [] as const;

export const LOST_WRITE_PATCH_DRAFT_OMIT_COUNT_BASELINE = 0;
