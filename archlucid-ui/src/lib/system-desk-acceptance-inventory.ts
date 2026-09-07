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
];
