/** Vitest evidence file for each professional-core prompt (wave 15 close / PC-AUDIT). */
export type ProfessionalCoreAcceptanceCase = {
  readonly id: `PC-${number}`;
  readonly relativeTestPath: string;
  readonly marker: string;
};

/**
 * Canonical PC-01–PC-13 regression anchors. Guard test fails if a file is deleted or
 * stops naming its prompt id (prevents silent wave regressions after overlays land).
 */
export const PROFESSIONAL_CORE_ACCEPTANCE_CASES: readonly ProfessionalCoreAcceptanceCase[] = [
  {
    id: "PC-01",
    relativeTestPath: "lib/quality/insight-density-measurement-floor.test.ts",
    marker: "PC-01",
  },
  {
    id: "PC-02",
    relativeTestPath: "lib/intake/universal-intake-must-engine-coverage.test.ts",
    marker: "PC-02",
  },
  {
    id: "PC-03",
    relativeTestPath: "lib/proxy/bff-session-cookie.test.ts",
    marker: "LK-07",
  },
  {
    id: "PC-04",
    relativeTestPath: "lib/production-desk-chrome-eval-guard.test.ts",
    marker: "production-desk-chrome eval guard",
  },
  {
    id: "PC-05",
    relativeTestPath: "lib/operator/operator-home-primary-cta-composition.test.ts",
    marker: "PC-05",
  },
  {
    id: "PC-06",
    relativeTestPath: "components/architecture/ArchitectureSealDeltaPanel.test.tsx",
    marker: "PC-06",
  },
  {
    id: "PC-07",
    relativeTestPath: "lib/operations/advisory-draft-architecture-id-honesty.test.ts",
    marker: "PC-07",
  },
  {
    id: "PC-08",
    relativeTestPath: "components/reviews/ReviewInPipelineBanner.test.tsx",
    marker: "PC-08",
  },
  {
    id: "PC-09",
    relativeTestPath: "hooks/use-review-presenter-elicitation.test.tsx",
    marker: "PC-09",
  },
  {
    id: "PC-10",
    relativeTestPath: "lib/findings/finding-recorded-disposition.test.ts",
    marker: "PC-10",
  },
  {
    id: "PC-11",
    relativeTestPath: "lib/command-palette-work-before-nav-order.test.ts",
    marker: "PC-11",
  },
  {
    id: "PC-12",
    relativeTestPath: "lib/vocabulary/pc-12-evidence-graph-surface-naming-guard.test.ts",
    marker: "PC-12",
  },
  {
    id: "PC-13",
    relativeTestPath: "lib/career-export-mounted-ui-paths.test.ts",
    marker: "PC-13",
  },
] as const;

export const PROFESSIONAL_CORE_ACCEPTANCE_DOC_RELATIVE_PATH =
  "docs/architecture/PROFESSIONAL_CORE_ACCEPTANCE_2026-09-06.md";
