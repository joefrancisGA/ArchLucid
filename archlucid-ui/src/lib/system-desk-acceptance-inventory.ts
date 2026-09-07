/** Vitest evidence file for system-desk prompts (ADR 0079 / wave SY). */
export type SystemDeskAcceptanceCase = {
  readonly id: `SY-${number}`;
  readonly relativeTestPath: string;
  readonly marker: string;
};

export const SYSTEM_DESK_ADR_0079_RELATIVE_PATH =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md";

/**
 * Canonical SY regression anchors for Working desk invariants.
 * Guard test fails if evidence files are deleted or stop naming their prompt id.
 */
export const SYSTEM_DESK_ACCEPTANCE_CASES: readonly SystemDeskAcceptanceCase[] = [
  {
    id: "SY-07",
    relativeTestPath: "lib/resolve-working-alt-r-href.test.ts",
    marker: "SY-07",
  },
  {
    id: "SY-08",
    relativeTestPath: "lib/resolve-working-desk-tool-href.test.ts",
    marker: "SY-08",
  },
  {
    id: "SY-16",
    relativeTestPath: "lib/architecture/architecture-routes.test.ts",
    marker: "startReviewFromDraftContextHref",
  },
  {
    id: "SY-36",
    relativeTestPath: "lib/architecture/architecture-routes.test.ts",
    marker: "SY-36",
  },
  {
    id: "SY-38",
    relativeTestPath: "lib/architecture/architecture-routes.test.ts",
    marker: "SY-38",
  },
  {
    id: "SY-45",
    relativeTestPath: "lib/resolve-working-insights-nav-href.test.ts",
    marker: "SY-45",
  },
  {
    id: "SY-18",
    relativeTestPath: "lib/first-review-guide-status.test.ts",
    marker: "SY-18",
  },
  {
    id: "SY-32",
    relativeTestPath: "lib/architectures-hub-copy.test.ts",
    marker: "SY-32",
  },
  {
    id: "SY-56",
    relativeTestPath: "lib/operator/operator-nav-labels.test.ts",
    marker: "SY-56",
  },
  {
    id: "SY-20",
    relativeTestPath: "lib/architecture/working-share-href.test.ts",
    marker: "SY-20",
  },
  {
    id: "SY-21",
    relativeTestPath: "lib/reviews/review-room-elicitation-url.test.ts",
    marker: "SY-21",
  },
  {
    id: "SY-22",
    relativeTestPath: "lib/reviews/review-pin-run-url.test.ts",
    marker: "SY-22",
  },
  {
    id: "SY-23",
    relativeTestPath: "lib/resolve-invite-reviewer-review-href.test.ts",
    marker: "SY-23",
  },
  {
    id: "SY-24",
    relativeTestPath: "lib/resolve-invite-reviewer-review-href.test.ts",
    marker: "SY-24",
  },
  {
    id: "SY-25",
    relativeTestPath: "lib/architecture/architecture-draft-intake-mode.test.ts",
    marker: "SY-25",
  },
  {
    id: "SY-26",
    relativeTestPath: "lib/architecture/working-back-href.test.ts",
    marker: "AO-44",
  },
  {
    id: "SY-27",
    relativeTestPath: "components/architecture/ArchitectureFindingsDualPane.test.tsx",
    marker: "SY-27",
  },
  {
    id: "SY-28",
    relativeTestPath: "lib/resolve-audit-trail-review-href.test.ts",
    marker: "SY-28",
  },
  {
    id: "SY-33",
    relativeTestPath: "lib/resolve-working-evidence-parent-link.test.ts",
    marker: "SY-33",
  },
  {
    id: "SY-34",
    relativeTestPath: "lib/decision-register-empty-teaching.test.ts",
    marker: "SY-34",
  },
  {
    id: "SY-35",
    relativeTestPath: "lib/usability/usability-consolidation.test.ts",
    marker: "SY-35",
  },
  {
    id: "SY-31",
    relativeTestPath: "lib/system-desk-evidence-copy-parent.test.ts",
    marker: "SY-31",
  },
  {
    id: "SY-51",
    relativeTestPath: "lib/system-desk-acceptance-guard.test.ts",
    marker: "SY-51",
  },
  {
    id: "SY-52",
    relativeTestPath: "app/(operator)/architecture/reviews/_sections/reviews-hub-page-copy-resolver.test.ts",
    marker: "AO-26",
  },
  {
    id: "SY-54",
    relativeTestPath: "lib/reviews-hub-unfinished-work-href.test.ts",
    marker: "SY-54",
  },
  {
    id: "SY-55",
    relativeTestPath: "lib/reviews-hub-evidence-copy.test.ts",
    marker: "SY-55",
  },
  {
    id: "SY-64",
    relativeTestPath: "lib/resolve-continue-last-review-package.test.ts",
    marker: "SY-64",
  },
  {
    id: "SY-70",
    relativeTestPath: "lib/pilot-scorecard-present.test.ts",
    marker: "SY-70",
  },
  {
    id: "SY-71",
    relativeTestPath: "lib/contextual-help/contextual-help-working-desk-copy-guard.test.ts",
    marker: "SY-71",
  },
  {
    id: "SY-77",
    relativeTestPath: "lib/working-review-detail-path-import-guard.test.ts",
    marker: "SY-77",
  },
  {
    id: "SY-61",
    relativeTestPath: "lib/architecture/working-architecture-document-title.test.ts",
    marker: "SY-61",
  },
  {
    id: "SY-87",
    relativeTestPath: "lib/getting-started-help-working-examples.test.ts",
    marker: "SY-87",
  },
  {
    id: "SY-87",
    relativeTestPath: "lib/contextual-help/contextual-help-working-href-guard.test.ts",
    marker: "SY-87",
  },
  {
    id: "SY-92",
    relativeTestPath: "lib/signed-records-working-desk-guard.test.ts",
    marker: "SY-92",
  },
  {
    id: "SY-98",
    relativeTestPath: "lib/working-desk-e2e-landing-guard.test.ts",
    marker: "SY-98",
  },
];
