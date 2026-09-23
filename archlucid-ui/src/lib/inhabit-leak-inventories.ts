/** Relative to repository root (parent of archlucid-ui). */
export const INHABIT_LEAK_INVENTORIES_DOC_PATH =
  "docs/architecture/INHABIT_LEAK_INVENTORIES.md" as const;

export type InhabitFindingsEditorSurfaceKind =
  | "nested-findings-desk"
  | "review-detail-inspect"
  | "governance-queue"
  | "quick-decision";

export type InhabitFindingsEditorSurfaceRow = {
  readonly surface: string;
  readonly hrefPattern: string;
  readonly architectureIdKnown: boolean;
  readonly editorKind: InhabitFindingsEditorSurfaceKind;
  readonly ownerPrompt: string;
};

/** IH-004 — findings editor still lives on review-detail for some verbs. */
export const INHABIT_FINDINGS_EDITOR_SURFACE_ROWS: readonly InhabitFindingsEditorSurfaceRow[] = [
  {
    surface: "Architecture nested findings desk",
    hrefPattern: "/architecture/architectures/{architectureId}/findings?runId={runId}",
    architectureIdKnown: true,
    editorKind: "nested-findings-desk",
    ownerPrompt: "IH-015",
  },
  {
    surface: "Review-detail finding inspect route",
    hrefPattern: "/architecture/reviews/{reviewId}/findings/{findingId}",
    architectureIdKnown: true,
    editorKind: "review-detail-inspect",
    ownerPrompt: "IR-004",
  },
  {
    // IR-015 skip: run-scoped peer queue stays peer — do not architecture-scope Working inhabit.
    surface: "Governance findings queue (peer)",
    hrefPattern: "/governance/findings?runId={runId}",
    architectureIdKnown: false,
    editorKind: "governance-queue",
    ownerPrompt: "IR-015",
  },
  {
    surface: "Quick decision workspace cards",
    hrefPattern: "in-page (review workspace)",
    architectureIdKnown: true,
    editorKind: "quick-decision",
    ownerPrompt: "IR-005",
  },
];

export type InhabitRecordCtaSimulatorLeakRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly hasSimulatorIncompletenessCopy: boolean;
  readonly ownerPrompt: string;
};

/** IH-005 — Record CTA can read career-complete before Simulator honesty ships on that surface. */
export const INHABIT_RECORD_CTA_SIMULATOR_LEAK_ROWS: readonly InhabitRecordCtaSimulatorLeakRow[] = [
  {
    surface: "architecture draft workspace Start review footer",
    relativePath: "components/architecture/ArchitectureDraftWorkspaceStartReviewFooter.tsx",
    hasSimulatorIncompletenessCopy: true,
    ownerPrompt: "IH-025",
  },
  {
    surface: "Architecture identity desk Start review command",
    relativePath: "components/architecture/ArchitectureIdentityDeskCommandBar.tsx",
    hasSimulatorIncompletenessCopy: true,
    ownerPrompt: "IH-025",
  },
  {
    surface: "Review package re-run / execute strip",
    relativePath: "app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.tsx",
    hasSimulatorIncompletenessCopy: true,
    ownerPrompt: "IH-025",
  },
  {
    // eslint-disable-next-line buyer-review-terminology/no-run-primary-copy -- inventory label mirrors the audited surface name.
    surface: "New run wizard final submit",
    relativePath: "app/(operator)/architecture/reviews/new/NewRunWizardClient.tsx",
    hasSimulatorIncompletenessCopy: true,
    ownerPrompt: "IH-025",
  },
];

export type InhabitDispositionReversibilityRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly toastUndo: boolean;
  readonly recordCorrectionVisible: boolean;
  readonly dispositionHistory: boolean;
  readonly ownerPrompt: string;
};

/** IH-006 — disposition recover path after the 300s toast expires. */
export const INHABIT_DISPOSITION_REVERSIBILITY_ROWS: readonly InhabitDispositionReversibilityRow[] = [
  {
    surface: "Governance finding row",
    relativePath: "components/governance/findings/GovernanceFindingRow.tsx",
    toastUndo: true,
    recordCorrectionVisible: true,
    dispositionHistory: true,
    ownerPrompt: "IR-006",
  },
  {
    surface: "Finding inspect disposition form",
    relativePath: "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.tsx",
    toastUndo: true,
    recordCorrectionVisible: true,
    dispositionHistory: true,
    ownerPrompt: "IH-034",
  },
  {
    surface: "Governance findings queue client",
    relativePath: "app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
    toastUndo: true,
    recordCorrectionVisible: true,
    dispositionHistory: true,
    ownerPrompt: "IR-007",
  },
  {
    surface: "Inhabited findings document card rows",
    relativePath: "components/governance/findings/GovernanceFindingsList.tsx",
    toastUndo: true,
    recordCorrectionVisible: true,
    dispositionHistory: true,
    ownerPrompt: "IH-034",
  },
  {
    surface: "Governance finding triage panel",
    relativePath: "components/governance/findings/GovernanceFindingTriagePanel.tsx",
    toastUndo: false,
    recordCorrectionVisible: true,
    dispositionHistory: true,
    ownerPrompt: "IH-034",
  },
];

export type InhabitQuietEngineCompletenessRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly namesQuietEnginesOnDesk: boolean;
  readonly ownerPrompt: string;
};

/** IH-007 — quiet engines named only on export / stamp surfaces. */
export const INHABIT_QUIET_ENGINE_COMPLETENESS_ROWS: readonly InhabitQuietEngineCompletenessRow[] = [
  {
    surface: "Nested findings empty state",
    relativePath: "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx",
    namesQuietEnginesOnDesk: true,
    ownerPrompt: "IH-021",
  },
  {
    surface: "Inhabited findings document chrome",
    relativePath: "components/governance/InhabitedFindingsDocumentChrome.tsx",
    namesQuietEnginesOnDesk: true,
    ownerPrompt: "IH-040",
  },
  {
    surface: "Run progress tracker Ready chrome",
    relativePath: "components/runs/use-run-progress-tracker.ts",
    namesQuietEnginesOnDesk: true,
    ownerPrompt: "IR-001",
  },
  {
    surface: "Pre-finalize checklist panel",
    relativePath: "components/reviews/PreFinalizeChecklistPanel.tsx",
    namesQuietEnginesOnDesk: true,
    ownerPrompt: "IH-041",
  },
  {
    surface: "Career export watermark gate",
    relativePath: "lib/career-artifact/career-artifact-honesty.ts",
    namesQuietEnginesOnDesk: true,
    ownerPrompt: "CG-021",
  },
];

export type InhabitExplorationCeremonyRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly sketchEntry: boolean;
  readonly committedCompareFromDesk: boolean;
  readonly ownerPrompt: string;
};

/** IH-008 — exploration still requires clone / committed Compare ceremony. */
export const INHABIT_EXPLORATION_CEREMONY_ROWS: readonly InhabitExplorationCeremonyRow[] = [
  {
    surface: "Architecture identity desk",
    relativePath: "components/architecture/ArchitectureIdentityDesk.tsx",
    sketchEntry: true,
    committedCompareFromDesk: true,
    ownerPrompt: "IH-047",
  },
  {
    surface: "Nested findings document chrome",
    relativePath: "components/governance/InhabitedFindingsDocumentChrome.tsx",
    sketchEntry: true,
    committedCompareFromDesk: true,
    ownerPrompt: "IH-047",
  },
  {
    surface: "Spawn-lock handoff clone control",
    relativePath: "components/architecture/ArchitectureDraftHandoffPanel.tsx",
    sketchEntry: true,
    committedCompareFromDesk: true,
    ownerPrompt: "IR-014",
  },
];

export type InhabitRoomPresenterRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly requiresLeavingArchitectureFindings: boolean;
  readonly ownerPrompt: string;
};

/** IH-009 — R4 room elicitation mounts (no presence / finding chat). */
export const INHABIT_ROOM_PRESENTER_ROWS: readonly InhabitRoomPresenterRow[] = [
  {
    surface: "Inhabited findings room card",
    relativePath: "components/governance/InhabitedFindingsRoomCard.tsx",
    requiresLeavingArchitectureFindings: false,
    ownerPrompt: "IH-053",
  },
  {
    surface: "Review presenter elicitation bridge",
    relativePath: "components/reviews/RunDetailPresenterElicitationBridge.tsx",
    requiresLeavingArchitectureFindings: false,
    ownerPrompt: "IR-012",
  },
  {
    surface: "Architecture draft room header",
    relativePath: "components/architecture/ArchitectureDraftRoomHeaderButton.tsx",
    requiresLeavingArchitectureFindings: false,
    ownerPrompt: "IR-013",
  },
  {
    surface: "Quick start L0 must questions panel",
    relativePath: "components/architecture/QuickStartL0MustQuestionsPanel.tsx",
    requiresLeavingArchitectureFindings: false,
    ownerPrompt: "IR-013",
  },
];

export type InhabitKeyboardFocusRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly defaultFocusFirstFinding: boolean;
  readonly paletteWorkActionsFirst: boolean;
  readonly ownerPrompt: string;
};

/** IH-010 — keyboard does not land on the first finding by default. */
export const INHABIT_KEYBOARD_FOCUS_ROWS: readonly InhabitKeyboardFocusRow[] = [
  {
    surface: "Nested findings page client",
    relativePath: "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx",
    defaultFocusFirstFinding: true,
    paletteWorkActionsFirst: true,
    ownerPrompt: "IH-059",
  },
  {
    surface: "Finding keyboard triage host",
    relativePath: "components/CommandPaletteActions.tsx",
    defaultFocusFirstFinding: true,
    paletteWorkActionsFirst: true,
    ownerPrompt: "IR-009",
  },
  {
    surface: "Finding card shortcuts hook",
    relativePath: "hooks/useFindingCardShortcuts.ts",
    defaultFocusFirstFinding: true,
    paletteWorkActionsFirst: true,
    ownerPrompt: "IR-008",
  },
];

export type InhabitContinuityPersistKind = "url" | "local-storage" | "account-prefs" | "memory" | "none";

export type InhabitContinuityRow = {
  readonly concern: string;
  readonly storageKeyOrMechanism: string;
  readonly persistKind: InhabitContinuityPersistKind;
  readonly architectureShaped: boolean;
  readonly ownerPrompt: string;
};

/** IH-011 — recents, pins, and finding selection are not inhabited continuity. */
export const INHABIT_CONTINUITY_ROWS: readonly InhabitContinuityRow[] = [
  {
    concern: "Operator recent views (last-open review)",
    storageKeyOrMechanism: "operator-recent-views localStorage + user preferences API",
    persistKind: "account-prefs",
    architectureShaped: true,
    ownerPrompt: "IH-066",
  },
  {
    concern: "Continue-last review package target",
    storageKeyOrMechanism: "resolve-continue-last-review-package",
    persistKind: "account-prefs",
    architectureShaped: true,
    ownerPrompt: "IR-010",
  },
  {
    concern: "Favorite reviews pins",
    storageKeyOrMechanism: "favoriteReviews localStorage + user preferences API",
    persistKind: "account-prefs",
    architectureShaped: true,
    ownerPrompt: "IR-011",
  },
  {
    concern: "Finding selection on nested findings",
    storageKeyOrMechanism: "focusedFinding URL query",
    persistKind: "url",
    architectureShaped: true,
    ownerPrompt: "IH-064",
  },
];

export type InhabitWorkingHomePipelineRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly teachesPipeline: boolean;
  readonly ownerPrompt: string;
};

/** IH-012 — Working Home still teaches create → execute → finalize. */
export const INHABIT_WORKING_HOME_PIPELINE_ROWS: readonly InhabitWorkingHomePipelineRow[] = [
  {
    surface: "Operator home unfinished work rail",
    relativePath: "components/operator-home/UnfinishedWorkRail.tsx",
    teachesPipeline: false,
    ownerPrompt: "IH-027",
  },
  {
    surface: "First review guide walkthrough",
    relativePath: "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideWalkthrough.tsx",
    teachesPipeline: false,
    ownerPrompt: "IR-003",
  },
  {
    surface: "Architecture identity desk (inhabit verbs)",
    relativePath: "components/architecture/ArchitectureIdentityDeskCommandBar.tsx",
    teachesPipeline: false,
    ownerPrompt: "IH-027",
  },
  {
    surface: "Core pilot wizard steps",
    relativePath: "lib/core-pilot-steps.ts",
    teachesPipeline: false,
    ownerPrompt: "IR-002",
  },
];

export type InhabitNestedReviewBackHrefRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly returnsToArchitecture: boolean;
  readonly ownerPrompt: string;
};

/** IH-024 — nested review-detail Back targets that still exile the architecture. */
export const INHABIT_NESTED_REVIEW_BACK_HREF_ROWS: readonly InhabitNestedReviewBackHrefRow[] = [
  {
    surface: "Finding detail page (Working back resolver)",
    relativePath: "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/FindingDetailPageView.tsx",
    returnsToArchitecture: true,
    ownerPrompt: "IH-024",
  },
  {
    surface: "Spawn-lock draft handoff",
    relativePath: "components/architecture/ArchitectureDraftHandoffPanel.tsx",
    returnsToArchitecture: true,
    ownerPrompt: "IH-022",
  },
  {
    surface: "Governance finding triage panel (in-document inspect)",
    relativePath: "components/governance/findings/GovernanceFindingTriagePanel.tsx",
    returnsToArchitecture: true,
    ownerPrompt: "IH-020",
  },
  {
    // IR-015 skip: Back does not return to architecture desk — peer queue is intentional.
    surface: "Peer governance findings queue (no architecture scope)",
    relativePath: "app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
    returnsToArchitecture: false,
    ownerPrompt: "IR-015",
  },
];
