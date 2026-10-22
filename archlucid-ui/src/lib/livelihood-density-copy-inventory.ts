/** Forbidden on Working/customer surfaces after ADR 0070 / IS-05 (LS-03). */
export const LIVELIHOOD_DENSITY_COPY_FORBIDDEN_SUBSTRING =
  "regardless of insight-density score" as const;

/**
 * Customer-visible modules that must not teach typed-engine rows stay Decision-grade
 * regardless of score. Guard test fails if any listed file contains the forbidden substring.
 */
export const LIVELIHOOD_DENSITY_COPY_GUARDED_RELATIVE_PATHS = [
  "lib/copy-finding-as-work-item-coverage-honesty.ts",
  "lib/findings/findings-snapshot-insight-density.ts",
  "components/usability/InsightDensityCurationBanner.tsx",
  "lib/package-print-view.ts",
] as const;
