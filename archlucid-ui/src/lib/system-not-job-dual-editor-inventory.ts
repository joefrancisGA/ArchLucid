/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY_DOC_PATH =
  "docs/architecture/SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md" as const;

export type SystemNotJobDualEditorParallelClass =
  | "locked"
  | "read-only-snapshot"
  | "alternate-writer"
  | "separate-kernel";

export type SystemNotJobDualEditorRow = {
  readonly field: string;
  readonly draftRoute: string;
  readonly reviewArchitectureTab: string;
  readonly spawnLocked: boolean;
  readonly parallelLiveEditAfterSpawn: boolean;
  readonly parallelClass: SystemNotJobDualEditorParallelClass;
  readonly ownerPrompt: string;
};

/**
 * Shrink-only baseline for dual-editor inventory rows (SN-002).
 * Do not add parallel-live-edit rows without a named SN follow-up.
 */
export const SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS: readonly SystemNotJobDualEditorRow[] = [
  {
    field: "systemName",
    draftRoute: "ArchitectureDraftFormFields → PATCH document.systemName",
    reviewArchitectureTab: "userAssertions.architectureName (read-only)",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "freeTextIntent",
    draftRoute: "ArchitectureDraftFormFields → PATCH document.freeTextIntent",
    reviewArchitectureTab: "RunDetailSubmittedArchitectureSection narrative preview",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "businessOutcome",
    draftRoute: "ArchitectureDraftFormFields → PATCH document.businessOutcome",
    reviewArchitectureTab: "userAssertions.businessOutcome (read-only)",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "structuredBrief",
    draftRoute: "ArchitectureDraftStructuredBriefFields → PATCH document.structuredBrief",
    reviewArchitectureTab: "Not inline-edited (handoff snapshot only)",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "openQuestions",
    draftRoute: "ArchitectureDraftFormFields → PATCH document.openQuestions",
    reviewArchitectureTab: "Not shown as editable",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "actorSet",
    draftRoute: "DraftIntakeActorEditor → PATCH document.actorSet",
    reviewArchitectureTab: "userAssertions.peopleAndSystems (read-only)",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "autosavePatch",
    draftRoute: "useArchitectureDraftAutosave on draft routes",
    reviewArchitectureTab: "N/A",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "aiRefineReasoning",
    draftRoute: "ArchitectureDraftAiRefinePanel · DraftIntakeReasoningPanel",
    reviewArchitectureTab: "N/A",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "scopeUnderstandingCheck",
    draftRoute: "ArchitectureScopeUnderstandingCheckPanel",
    reviewArchitectureTab: "N/A",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "invariantEnvelopePreview",
    draftRoute: "DraftInvariantEnvelopePreview",
    reviewArchitectureTab: "N/A",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-008",
  },
  {
    field: "startArchitectureReview",
    draftRoute: "ArchitectureDraftWorkspaceStartReviewFooter",
    reviewArchitectureTab: "N/A",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "workLease",
    draftRoute: "useArchitectureDraftWorkLease",
    reviewArchitectureTab: "N/A",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "locked",
    ownerPrompt: "SN-004",
  },
  {
    field: "submittedArchitectureSnapshot",
    draftRoute: "ArchitectureDraftHandoffPanel field summary (Working)",
    reviewArchitectureTab: "RunDetailSubmittedArchitectureSection (read-only)",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "read-only-snapshot",
    ownerPrompt: "SN-013",
  },
  {
    field: "editSourceGuidedIntakeRerun",
    draftRoute: "N/A",
    reviewArchitectureTab: "Edit source suppressed for Created-origin; Reviewed-origin rerun when !manifestId",
    spawnLocked: true,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "read-only-snapshot",
    ownerPrompt: "SN-004",
  },
  {
    field: "technologyBaseline",
    draftRoute: "N/A",
    reviewArchitectureTab: "RunDetailTechnologyBaselineSection",
    spawnLocked: false,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "separate-kernel",
    ownerPrompt: "SN-010",
  },
  {
    field: "architectureGraph",
    draftRoute: "N/A",
    reviewArchitectureTab: "RunDetailArchitectureGraphIsland",
    spawnLocked: false,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "separate-kernel",
    ownerPrompt: "SN-010",
  },
  {
    field: "findingsEvidenceDecisions",
    draftRoute: "N/A",
    reviewArchitectureTab: "Other review workspace tabs",
    spawnLocked: false,
    parallelLiveEditAfterSpawn: false,
    parallelClass: "separate-kernel",
    ownerPrompt: "intentional",
  },
];

/** Shrink-only: zero parallel-live-edit rows after SN-004 one-writer ratchet. */
export const SYSTEM_NOT_JOB_DUAL_EDITOR_PARALLEL_LIVE_EDIT_COUNT_BASELINE = 0;
