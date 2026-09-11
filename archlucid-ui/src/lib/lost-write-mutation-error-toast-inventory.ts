/**
 * LW-097 — livelihood mutation failure toasts must use sticky duration (showMutationError / showMutationApiError).
 * Inline TB-2155 errors remain primary on guarded surfaces; toasts are supplementary when present.
 */

export type LostWriteMutationErrorToastRow = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  /** When set, lines matching showError/toast.error must also match at least one pattern. */
  readonly allowedTransientToastLinePatterns?: readonly RegExp[];
  readonly notes: string;
};

export const LOST_WRITE_MUTATION_ERROR_TOAST_INVENTORY: readonly LostWriteMutationErrorToastRow[] = [
  {
    id: "architecture-draft-save",
    sourceRoots: [
      "components/architecture/ArchitectureDraftWorkspaceSaveActions.tsx",
      "hooks/use-architecture-draft-autosave-persist.ts",
    ],
    notes: "Explicit save + non-conflict persist failures; 409 conflict stays inline-only (TB-2006).",
  },
  {
    id: "architecture-draft-delete",
    sourceRoots: ["components/architecture/ArchitectureDraftDeleteControl.tsx"],
    notes: "Abandon draft mutation failure.",
  },
  {
    id: "architecture-share-grant",
    sourceRoots: [
      "components/architecture/ArchitectureSponsorSharingPanel.tsx",
      "components/ShareReviewPackageButton.tsx",
    ],
    allowedTransientToastLinePatterns: [
      /Could not copy sponsor report/i,
      /sealed/i,
      /Finalize the review/i,
    ],
    notes: "Share / sponsor-report mutation failures only; clipboard and prerequisite hints stay transient.",
  },
  {
    id: "architecture-review-finalize-in-flight",
    sourceRoots: ["hooks/use-shell-in-flight-operations.ts"],
    notes: "Terminal failed in-flight livelihood operations (finalize, analysis, …).",
  },
  {
    id: "finding-merge-conflict-resolution",
    sourceRoots: ["components/findings/FindingMergeConflictResolvePanel.tsx"],
    notes: "Disposition-adjacent merge conflict resolution mutation.",
  },
] as const;
