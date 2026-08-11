import { BUYER_COPY_MODULE_PATHS } from "@/lib/buyer-copy/module-paths";

/** Customer-facing modules scanned by {@link ./internal-concept-leakage-guard.test.ts} (IA-013). */
export const INTERNAL_CONCEPT_LEAKAGE_SURFACES = [
  "src/app/(operator)/administration/users/_sections/SettingsRolesPageView.tsx",
  "src/app/(operator)/internal/trial-funnel/_sections/TrialFunnelOpsPageClient.tsx",
  "src/app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.tsx",
  ...BUYER_COPY_MODULE_PATHS,
  "src/lib/empty-state-presets.ts",
] as const;

/** Internal rank / policy names that must not appear in customer-visible copy strings. */
export const INTERNAL_CONCEPT_LEAKAGE_BANNED_PATTERNS = [
  'Authority"',
  "Authority)",
  "admin-ranked",
  "V1 is sold",
] as const;

/**
 * Buyer copy modules swept to finalize/review vocabulary (2026-08-03) and locked against
 * regression by {@link ./internal-concept-leakage-vocabulary.test.ts}. Only add a file here
 * after verifying it contains none of {@link BUYER_VOCABULARY_BANNED_LITERALS}.
 * End-state rule and remaining backfill: docs/library/VOCABULARY_ROSETTA.md.
 */
export const BUYER_VOCABULARY_LEAKAGE_SURFACES = [
  "src/lib/vocabulary/buyer-surface-vocabulary.ts",
  ...BUYER_COPY_MODULE_PATHS,
  "src/lib/executive/executive-dashboard-page-copy.ts",
  "src/lib/review-scorecard-empty-state.ts",
  "src/lib/search-empty-preset.ts",
  "src/lib/enterprise-compact-empty-state-presets.ts",
  "src/lib/layer-guidance.ts",
] as const;

/**
 * Internal workflow verbs banned in buyer-rendered copy (buyer verb: Finalize — see
 * CONCEPT_VOCABULARY.md UI glossary). Narrow literals on purpose: code identifiers like
 * `hasCommittedRuns` or `PreCommitGovernanceGate` stay legal; only rendered-copy phrasing
 * is banned.
 */
export const BUYER_VOCABULARY_BANNED_LITERALS = [
  "Commit a review",
  "Commit at least one review",
  "Commit reviews",
  "committed review",
  "Committed review",
  "golden manifest",
] as const;
