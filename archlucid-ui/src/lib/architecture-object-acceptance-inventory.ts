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
];
