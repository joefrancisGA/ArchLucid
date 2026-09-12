/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY_DOC_PATH =
  "docs/architecture/SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY.md" as const;

export type SystemNotJobCompareGateOutcome =
  | "allowed"
  | "blocked"
  | "polls-until-sealed"
  | "orientation-only";

export type SystemNotJobCompareGateJourney = {
  readonly journeyId: string;
  readonly userIntent: string;
  readonly leftSide: string;
  readonly rightSide: string;
  readonly gateOutcome: SystemNotJobCompareGateOutcome;
  readonly blockedReason: string;
  readonly surface: string;
  readonly backendGate: string;
  readonly cheapPathOwner: string | null;
  readonly draftDiffRejected: boolean;
};

/**
 * Shrink-only inventory for Working journeys that die at the Compare gate (SN-006).
 * Compare requires two committed golden manifests (R12 / ADR 0092). Do not add draft-diff rows.
 */
export const SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS: readonly SystemNotJobCompareGateJourney[] = [
  {
    journeyId: "draftVsDraft",
    userIntent: "Compare two architecture drafts side by side as Career proof",
    leftSide: "DraftRequests document (unsealed synthesis)",
    rightSide: "DraftRequests document (unsealed synthesis)",
    gateOutcome: "blocked",
    blockedReason:
      "Draft-to-draft Compare is rejected (R12). No draft id pair enters AuthorityCompareService.",
    surface: "N/A — no draft-vs-draft Compare route",
    backendGate: "AuthorityCompareService requires GoldenManifestId on both runs",
    cheapPathOwner: "SN-008",
    draftDiffRejected: true,
  },
  {
    journeyId: "draftVsSealedRun",
    userIntent: "Diff live draft edits against a finalized review without finalizing the draft",
    leftSide: "In-flight draft (DraftRequests)",
    rightSide: "Committed run (GoldenManifestId + ManifestHash)",
    gateOutcome: "blocked",
    blockedReason: "Draft is not a run/manifest; Compare pickers list committed runs only.",
    surface: "CompareForm · useCompareFinalizedRunAvailability (committedOnly)",
    backendGate: "CompareRunsAsync manifest diff only when both GoldenManifestId set",
    cheapPathOwner: "SN-008",
    draftDiffRejected: true,
  },
  {
    journeyId: "spawnLockedDraftVsSealedRun",
    userIntent: "Compare spawn-locked handoff snapshot to a sealed peer review",
    leftSide: "Spawn-locked draft handoff (ArchitectureDraftHandoffPanel)",
    rightSide: "Committed golden manifest",
    gateOutcome: "blocked",
    blockedReason: "Spawn-locked draft is a synthesis handoff, not a Compare manifest anchor.",
    surface: "Working nested draft · identity desk redirect",
    backendGate: "AuthorityCompareService · isRunCommittedForBaseline",
    cheapPathOwner: "SN-008",
    draftDiffRejected: true,
  },
  {
    journeyId: "inFlightRunVsSealedRun",
    userIntent: "Compare an in-progress review to a finalized baseline",
    leftSide: "Run without GoldenManifestId",
    rightSide: "Committed golden manifest",
    gateOutcome: "blocked",
    blockedReason:
      "Manifest diff omitted until both sides finalize; 409 lifecycle copy via compareRunPairBlockedReason.",
    surface: "CompareForm · CompareRunPickersSection · runSummaryBlockedReason",
    backendGate: "AuthorityCompareService.CompareRunsAsync",
    cheapPathOwner: null,
    draftDiffRejected: false,
  },
  {
    journeyId: "inFlightRunVsInFlightRun",
    userIntent: "Compare two pipeline runs before either is finalized",
    leftSide: "Run without GoldenManifestId",
    rightSide: "Run without GoldenManifestId",
    gateOutcome: "blocked",
    blockedReason: "Neither side has a committed manifest; golden manifest comparison is skipped.",
    surface: "CompareForm · useCompareFinalizedRunAvailability",
    backendGate: "AuthorityCompareService.CompareRunsAsync",
    cheapPathOwner: null,
    draftDiffRejected: false,
  },
  {
    journeyId: "labeledEnvelopePreview",
    userIntent: "Treat local invariant envelope preview as sealed Compare",
    leftSide: "DraftInvariantEnvelopePreview (local sketch)",
    rightSide: "Any sealed manifest",
    gateOutcome: "orientation-only",
    blockedReason:
      "Envelope preview is orientation only; full sealed Compare still requires a committed package.",
    surface: "DraftInvariantEnvelopePreview · ADR 0092 labeled envelope",
    backendGate: "No Compare API — preview is client-local",
    cheapPathOwner: "SN-008",
    draftDiffRejected: true,
  },
  {
    journeyId: "labeledEnvelopeVsSeal",
    userIntent: "Compare a Rehearsal-stamped cheap envelope sketch to Career proof",
    leftSide: "Labeled what-if envelope (ADR 0092, committed golden manifest)",
    rightSide: "Committed golden manifest (Career seal)",
    gateOutcome: "allowed",
    blockedReason:
      "Both sides are committed runs; Compare pickers show door stamps and diff manifests (SN-014 / CG-057).",
    surface: "CompareForm · CompareRunPickersSection · committedOnly + stamp footnotes",
    backendGate: "AuthorityCompareService.CompareRunsAsync · GoldenManifestId on both runs",
    cheapPathOwner: "SN-014",
    draftDiffRejected: false,
  },
  {
    journeyId: "whatIfBranchBeforeFinalize",
    userIntent: "Auto-compare parent vs what-if branch immediately after branch submit",
    leftSide: "Parent run (may be in-flight)",
    rightSide: "Branch run (may be in-flight)",
    gateOutcome: "polls-until-sealed",
    blockedReason:
      "WhatIfBranchCompareBanner polls until bothRunsReadyForBranchCompare (two golden manifests).",
    surface: "WhatIfBranchCompareBanner · useWhatIfBranchAutoCompare · draft-branch-auto-compare",
    backendGate: "bothRunsReadyForBranchCompare · AuthorityCompareService",
    cheapPathOwner: null,
    draftDiffRejected: false,
  },
  {
    journeyId: "comparePageInsufficientFinalized",
    userIntent: "Open Compare with fewer than two finalized reviews in scope",
    leftSide: "Tenant/architecture finalized inventory",
    rightSide: "N/A",
    gateOutcome: "blocked",
    blockedReason: "insufficientForCompare when finalizedCount < 2 (committedOnly inventory).",
    surface: "CompareInsufficientFinalizedEmptyState · useCompareFinalizedRunAvailability",
    backendGate: "useAskProjectRunsQuery committedOnly + hasGoldenManifest filter",
    cheapPathOwner: null,
    draftDiffRejected: false,
  },
  {
    journeyId: "nestedArchitectureCompareScoped",
    userIntent: "Compare two reviews from Working nested architecture desk",
    leftSide: "Finalized run under architectureId scope",
    rightSide: "Finalized run under architectureId scope",
    gateOutcome: "blocked",
    blockedReason: "Same two-manifest gate; scope only filters pickers, not the seal requirement.",
    surface: "ArchitectureNestedComparePageClient · CompareForm basePathname",
    backendGate: "AuthorityCompareService · useCompareFinalizedRunAvailability(architectureId)",
    cheapPathOwner: null,
    draftDiffRejected: false,
  },
  {
    journeyId: "architectureSealDeltaOrientation",
    userIntent: "Use seal-delta panel as Career Compare substitute",
    leftSide: "Current draft document",
    rightSide: "Last sealed record (orientation)",
    gateOutcome: "orientation-only",
    blockedReason: "ArchitectureSealDeltaPanel compares draft to prior seal for orientation only.",
    surface: "ArchitectureSealDeltaPanel · architecture-seal-delta-honesty",
    backendGate: "No AuthorityCompareService — desk orientation API",
    cheapPathOwner: "SN-008",
    draftDiffRejected: true,
  },
  {
    journeyId: "compareToBaselineUnfinalizedCurrent",
    userIntent: "Compare stored browser baseline to an in-flight current review",
    leftSide: "Committed baseline run (localStorage)",
    rightSide: "Current run without golden manifest",
    gateOutcome: "blocked",
    blockedReason: "CompareToBaselineCta links to Compare; API blocks unfinalized side with 409 copy.",
    surface: "CompareToBaselineCta · comparePageHrefAdaptive · compareRunPairBlockedReason",
    backendGate: "AuthorityCompareService.CompareRunsAsync",
    cheapPathOwner: null,
    draftDiffRejected: false,
  },
];

/** Shrink-only: draft-diff Compare journeys must stay rejected (ADR 0092 / R12). */
export const SYSTEM_NOT_JOB_COMPARE_GATE_DRAFT_DIFF_REJECTED_COUNT_BASELINE = 5;

/** Cheap-path pointer for journeys that die at Compare — clone-from-snapshot desk (SN-008). */
export const SYSTEM_NOT_JOB_COMPARE_GATE_CHEAP_PATH_OWNER = "SN-008" as const;

/** Allowed labeled-envelope Compare path — committed rehearsal vs Career seal (SN-014). */
export const SYSTEM_NOT_JOB_COMPARE_LABELED_ENVELOPE_OWNER = "SN-014" as const;
