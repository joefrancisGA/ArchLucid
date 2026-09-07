/** Vitest evidence file for architecture-object prompts (ADR 0077 / issue #1). */
export type ArchitectureObjectAcceptanceCase = {
  readonly id: `AO-${number}`;
  readonly relativeTestPath: string;
  readonly marker: string;
};

export const ARCHITECTURE_OBJECT_ADR_0077_RELATIVE_PATH =
  "docs/architecture/adrs/0077-working-architecture-is-the-locator.md";

/**
 * Canonical AO regression anchors for Working locator invariants.
 * Guard test fails if evidence files are deleted or stop naming their prompt id.
 */
export const ARCHITECTURE_OBJECT_ACCEPTANCE_CASES: readonly ArchitectureObjectAcceptanceCase[] = [
  {
    id: "AO-02",
    relativeTestPath: "lib/architecture/architecture-routes.test.ts",
    marker: "AO-02",
  },
  {
    id: "AO-13",
    relativeTestPath: "lib/operator-home-working-primary-guard.test.ts",
    marker: "AO-13",
  },
  {
    id: "AO-15",
    relativeTestPath: "lib/working-start-route.test.ts",
    marker: "AO-15",
  },
  {
    id: "AO-26",
    relativeTestPath: "app/(operator)/architecture/reviews/_sections/reviews-hub-page-copy-resolver.test.ts",
    marker: "AO-26",
  },
  {
    id: "AO-22",
    relativeTestPath: "lib/architecture/architecture-nested-start-review-routes.test.ts",
    marker: "AO-22",
  },
  {
    id: "AO-09",
    relativeTestPath: "lib/architecture/working-share-href.test.ts",
    marker: "AO-09",
  },
  {
    id: "AO-27",
    relativeTestPath: "lib/governance/governance-return-locator.test.ts",
    marker: "AO-27",
  },
  {
    id: "AO-33",
    relativeTestPath: "lib/architecture/working-architecture-review-routes.test.ts",
    marker: "AO-33",
  },
  {
    id: "AO-35",
    relativeTestPath: "lib/architecture/finalize-success-desk-href.test.ts",
    marker: "AO-35",
  },
  {
    id: "AO-28",
    relativeTestPath: "lib/governance/governance-findings-architecture-scope.test.ts",
    marker: "AO-28",
  },
  {
    id: "AO-34",
    relativeTestPath: "components/architecture/WorkingNestedArchitectureIdentityChrome.test.tsx",
    marker: "AO-34",
  },
  {
    id: "AO-07",
    relativeTestPath: "lib/architecture/architecture-draft-spawn-handoff-working-guard.test.ts",
    marker: "AO-07",
  },
  {
    id: "AO-20",
    relativeTestPath: "components/architecture/ArchitectureIdentityDesk.test.tsx",
    marker: "AO-20",
  },
  {
    id: "AO-24",
    relativeTestPath: "components/architecture/ArchitectureDraftWorkspace.test.tsx",
    marker: "AO-24",
  },
  {
    id: "AO-25",
    relativeTestPath: "lib/working-start-route.test.ts",
    marker: "AO-25",
  },
  {
    id: "AO-29",
    relativeTestPath: "lib/architecture/resolve-architecture-compare-defaults.test.ts",
    marker: "AO-29",
  },
  {
    id: "AO-30",
    relativeTestPath: "lib/architecture/resolve-open-architecture-job-run-id.test.ts",
    marker: "AO-30",
  },
  {
    id: "AO-31",
    relativeTestPath: "lib/resolve-working-insights-nav-href.test.ts",
    marker: "AO-31",
  },
  {
    id: "AO-32",
    relativeTestPath: "lib/search/working-architecture-search-scope.test.ts",
    marker: "AO-32",
  },
  {
    id: "AO-36",
    relativeTestPath: "components/architecture/architecture-draft-clone-snapshot.test.tsx",
    marker: "AO-36",
  },
  {
    id: "AO-37",
    relativeTestPath: "lib/reviews/review-pin-run-url.test.ts",
    marker: "AO-37",
  },
  {
    id: "AO-38",
    relativeTestPath: "lib/architecture/working-share-href.test.ts",
    marker: "AO-38",
  },
  {
    id: "AO-39",
    relativeTestPath: "lib/working-route-roles.test.ts",
    marker: "AO-39",
  },
  {
    id: "AO-40",
    relativeTestPath: "lib/working-bind-tool-nav.test.ts",
    marker: "AO-40",
  },
  {
    id: "AO-41",
    relativeTestPath: "lib/resolve-visible-command-palette-actions.test.ts",
    marker: "AO-41",
  },
  {
    id: "AO-47",
    relativeTestPath: "lib/working-start-route-architecture-locator-guard.test.ts",
    marker: "AO-47",
  },
  {
    id: "AO-42",
    relativeTestPath: "lib/help/help-working-desk-copy-guard.test.ts",
    marker: "AO-42",
  },
  {
    id: "AO-43",
    relativeTestPath: "lib/shortcut-registry.test.ts",
    marker: "AO-43",
  },
  {
    id: "AO-44",
    relativeTestPath: "lib/architecture/working-back-href.test.ts",
    marker: "AO-44",
  },
  {
    id: "AO-45",
    relativeTestPath: "lib/guided-two-door-working-guard.test.ts",
    marker: "AO-45",
  },
  {
    id: "AO-46",
    relativeTestPath: "lib/ux-audit-working-home-guard.test.ts",
    marker: "AO-46",
  },
  {
    id: "AO-48",
    relativeTestPath: "lib/desk-continuity-architecture-locator.test.ts",
    marker: "AO-48",
  },
  {
    id: "AO-49",
    relativeTestPath: "lib/architecture/working-unlinked-review-honesty.test.ts",
    marker: "AO-49",
  },
];
