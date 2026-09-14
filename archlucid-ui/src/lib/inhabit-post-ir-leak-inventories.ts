/** Relative to repository root (parent of archlucid-ui). */
export const INHABIT_POST_IR_LEAK_INVENTORIES_DOC_PATH =
  "docs/architecture/INHABIT_POST_IR_LEAK_INVENTORIES.md" as const;

export type InhabitPostIrLeakRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly leakOpen: boolean;
  readonly ownerPrompt: string;
};

/** IP-002 — Reviews hub Continue and row href exile the inhabited findings document. */
export const INHABIT_POST_IR_REVIEWS_HUB_LANDING_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Reviews hub Continue strip",
    relativePath: "lib/reviews-hub-continue-review.ts",
    leakOpen: false,
    ownerPrompt: "IP-002",
  },
  {
    surface: "Reviews hub row primary href",
    relativePath: "app/(operator)/architecture/reviews/_sections/reviews-hub-package-display.ts",
    leakOpen: false,
    ownerPrompt: "IP-002",
  },
];

/** IP-003 — Global search resume opens the job inspector, not nested findings. */
export const INHABIT_POST_IR_GLOBAL_SEARCH_LANDING_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Global search run resume",
    relativePath: "components/use-global-search-bar.ts",
    leakOpen: false,
    ownerPrompt: "IP-003",
  },
  {
    surface: "Global search finding inspect",
    relativePath: "components/use-global-search-bar.ts",
    leakOpen: false,
    ownerPrompt: "IP-003",
  },
  {
    surface: "Global search package finding link",
    relativePath: "components/GlobalSearchPackageResultsPanel.tsx",
    leakOpen: false,
    ownerPrompt: "IP-003",
  },
];

/** IP-004 — Working share copies the review-detail inspector URL. */
export const INHABIT_POST_IR_WORKING_SHARE_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Working share href resolver",
    relativePath: "lib/architecture/working-share-href.ts",
    leakOpen: false,
    ownerPrompt: "IP-004",
  },
  {
    surface: "Working review copy link button",
    relativePath: "components/reviews/WorkingReviewCopyLinkButton.tsx",
    leakOpen: false,
    ownerPrompt: "IP-004",
  },
];

/** IP-005 — Quick-decision cards on review-detail ignore architecture-scoped inhabited hrefs. */
export const INHABIT_POST_IR_QUICK_DECISION_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Quick-decision primary finding card",
    relativePath: "components/findings/QuickDecisionWorkspacePrimaryFindingCard.tsx",
    leakOpen: false,
    ownerPrompt: "IP-005",
  },
  {
    surface: "Quick-decision secondary finding card",
    relativePath: "components/findings/QuickDecisionWorkspaceSecondaryFindingCard.tsx",
    leakOpen: false,
    ownerPrompt: "IP-005",
  },
  {
    surface: "Run detail findings dense table",
    relativePath: "components/findings/RunDetailFindingsDenseTable.tsx",
    leakOpen: false,
    ownerPrompt: "IP-005",
  },
];

/** IP-006 — Completion notification deep-links to review-detail. */
export const INHABIT_POST_IR_COMPLETION_TOAST_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Review completion notification",
    relativePath: "hooks/use-review-completion-notification.ts",
    leakOpen: false,
    ownerPrompt: "IP-006",
  },
  {
    surface: "Review completion href resolver",
    relativePath: "lib/reviews/resolve-review-completion-href.ts",
    leakOpen: false,
    ownerPrompt: "IP-006",
  },
];

/** IP-007 — Room on review-detail does not redirect to inhabited findings like Present. */
export const INHABIT_POST_IR_ROOM_ON_REVIEW_DETAIL_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Review room header button",
    relativePath: "components/reviews/ReviewRoomHeaderButton.tsx",
    leakOpen: false,
    ownerPrompt: "IP-007",
  },
  {
    surface: "Presenter elicitation bridge (room path)",
    relativePath: "components/reviews/RunDetailPresenterElicitationBridge.tsx",
    leakOpen: false,
    ownerPrompt: "IP-007",
  },
  {
    surface: "Room elicitation shortcut host (Alt+M)",
    relativePath: "components/reviews/ReviewRoomElicitationShortcutHost.tsx",
    leakOpen: false,
    ownerPrompt: "IP-007",
  },
];

/** IP-008 — Finding inspect support band omits structural execution mode. */
export const INHABIT_POST_IR_INSPECT_SUPPORT_BAND_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Finding detail header support chip",
    relativePath:
      "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/FindingDetailHeader.tsx",
    leakOpen: false,
    ownerPrompt: "IP-008",
  },
  {
    surface: "Finding detail inspect body support chip",
    relativePath:
      "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/FindingDetailInspectBody.tsx",
    leakOpen: false,
    ownerPrompt: "IP-008",
  },
  {
    surface: "Finding semantic support band inspect section",
    relativePath: "components/findings/FindingSemanticSupportBandInspectSection.tsx",
    leakOpen: false,
    ownerPrompt: "IP-008",
  },
];

/** IP-009 — Secondary re-run mounts lack Working start-honesty notices. */
export const INHABIT_POST_IR_SECONDARY_RERUN_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Run progress tracker terminal-failure re-run",
    relativePath: "components/runs/RunProgressTracker.tsx",
    leakOpen: false,
    ownerPrompt: "IP-009",
  },
  {
    surface: "Run agent quality warnings re-run",
    relativePath: "components/runs/RunAgentQualityWarningsPanel.tsx",
    leakOpen: false,
    ownerPrompt: "IP-009",
  },
];

/** IP-010 — Inspector finalize omits parentArchitectureId and stays on the job. */
export const INHABIT_POST_IR_INSPECTOR_FINALIZE_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Review package Do this next finalize",
    relativePath: "app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.tsx",
    leakOpen: false,
    ownerPrompt: "IP-010",
  },
];

/** IP-011 — Inhabited chrome first-paint trail and run-scope banner leaks. */
export const INHABIT_POST_IR_INHABITED_CHROME_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Inhabited findings document chrome (reasoned-no first paint)",
    relativePath: "components/governance/InhabitedFindingsDocumentChrome.tsx",
    leakOpen: false,
    ownerPrompt: "IP-011",
  },
  {
    surface: "Governance findings queue run-scope banner",
    relativePath: "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection.tsx",
    leakOpen: false,
    ownerPrompt: "IP-011",
  },
];

/** WA-001 — Post-diagnosis inhabited queue auxiliary CTA leaks (2026-09-14). */
export const INHABIT_POST_DIAGNOSIS_QUEUE_AUXILIARY_ROWS: readonly InhabitPostIrLeakRow[] = [
  {
    surface: "Continue last viewed finding strip",
    relativePath: "lib/resolve-continue-last-governance-finding.ts",
    leakOpen: false,
    ownerPrompt: "WA-001",
  },
  {
    surface: "First finding triage strip",
    relativePath: "app/(operator)/governance/findings/governance-findings-queue-presentation.ts",
    leakOpen: false,
    ownerPrompt: "WA-001",
  },
  {
    surface: "Assigned-to-me oldest finding strip",
    relativePath: "app/(operator)/governance/findings/governance-findings-queue-presentation.ts",
    leakOpen: false,
    ownerPrompt: "WA-001",
  },
  {
    surface: "Canonical secondary strip on findings register",
    relativePath: "lib/canonical-object-home-registry.ts",
    leakOpen: false,
    ownerPrompt: "WA-001",
  },
];

/**
 * IP-012 — Nested review-detail stays a job inspector (ADR 0098).
 * No product rows. Entry leaks are closed by IP-002–007; do not redirect the full inspector
 * workspace to findings or architecture-scope peer `/governance/findings`.
 */
export const INHABIT_POST_IR_INSPECTOR_SKIP_OWNER = "IP-012" as const;

export const INHABIT_POST_IR_INSPECTOR_SKIP_NOTE =
  "Inspector URLs (/architecture/reviews/{runId} and nested architecture review routes) are intentional. Full review workspace tabs stay visible; in-flight activity and explicit View review job links remain." as const;

/** All post-IR secondary inspector leak rows (IP-002–IP-011) plus diagnosis follow-up WA-001. */
export const INHABIT_POST_IR_ALL_LEAK_ROWS: readonly InhabitPostIrLeakRow[] = [
  ...INHABIT_POST_IR_REVIEWS_HUB_LANDING_ROWS,
  ...INHABIT_POST_IR_GLOBAL_SEARCH_LANDING_ROWS,
  ...INHABIT_POST_IR_WORKING_SHARE_ROWS,
  ...INHABIT_POST_IR_QUICK_DECISION_ROWS,
  ...INHABIT_POST_IR_COMPLETION_TOAST_ROWS,
  ...INHABIT_POST_IR_ROOM_ON_REVIEW_DETAIL_ROWS,
  ...INHABIT_POST_IR_INSPECT_SUPPORT_BAND_ROWS,
  ...INHABIT_POST_IR_SECONDARY_RERUN_ROWS,
  ...INHABIT_POST_IR_INSPECTOR_FINALIZE_ROWS,
  ...INHABIT_POST_IR_INHABITED_CHROME_ROWS,
  ...INHABIT_POST_DIAGNOSIS_QUEUE_AUXILIARY_ROWS,
];
