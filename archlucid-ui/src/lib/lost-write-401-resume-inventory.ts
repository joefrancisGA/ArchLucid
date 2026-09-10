export type LostWrite401ResumePolicy = "yes" | "no";

export type LostWrite401ResumeKindRow = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly resumeWrapperPresent: LostWrite401ResumePolicy;
  readonly notes: string;
};

/**
 * Livelihood mutating calls vs LP-19 401 resume wrappers (LW-003).
 * "yes" rows must keep their wrapper; "no" rows drive LW-053–062. Shrink "no" by adding kinds.
 */
export const LOST_WRITE_401_RESUME_KIND_INVENTORY: readonly LostWrite401ResumeKindRow[] = [
  {
    id: "finding_disposition",
    sourceRoots: ["lib/api/governance-stickiness-api-dispositions.ts"],
    resumeWrapperPresent: "yes",
    notes: "LP-19 recordFindingDispositionWith401Resume.",
  },
  {
    id: "governance_mutation_correction",
    sourceRoots: ["lib/governance/governance-mutation-correction-api.ts"],
    resumeWrapperPresent: "yes",
    notes: "LP-19 recordGovernanceMutationCorrectionWith401Resume.",
  },
  {
    id: "finding_bulk_disposition",
    sourceRoots: [
      "components/usability/GovernanceFindingsBulkActions.tsx",
      "lib/api/governance-stickiness-api-dispositions.ts",
    ],
    resumeWrapperPresent: "no",
    notes: "recordBulkFindingDisposition has no 401 resume (LW-056).",
  },
  {
    id: "architecture_draft_patch",
    sourceRoots: ["hooks/use-architecture-draft-autosave-persist.ts"],
    resumeWrapperPresent: "no",
    notes: "Draft PATCH 401 is not persisted (LW-055). Offline queue is a separate path.",
  },
  {
    id: "architecture_review_finalize",
    sourceRoots: ["components/CommitRunButton.tsx"],
    resumeWrapperPresent: "no",
    notes: "commitArchitectureRun has no 401 resume (LW-058).",
  },
] as const;

export const LOST_WRITE_401_RESUME_YES_KIND_IDS = ["finding_disposition", "governance_mutation_correction"] as const;
