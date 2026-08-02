/** Customer-facing modules scanned by {@link ./internal-concept-leakage-guard.test.ts} (IA-013). */
export const INTERNAL_CONCEPT_LEAKAGE_SURFACES = [
  "src/app/(operator)/administration/settings/users/_sections/SettingsRolesPageView.tsx",
  "src/app/(operator)/admin/trial-funnel/_sections/TrialFunnelOpsPageClient.tsx",
  "src/app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.tsx",
  "src/lib/buyer-polish-copy.ts",
  "src/lib/empty-state-presets.ts",
] as const;

/** Internal rank / policy names that must not appear in customer-visible copy strings. */
export const INTERNAL_CONCEPT_LEAKAGE_BANNED_PATTERNS = [
  'Authority"',
  "Authority)",
  "admin-ranked",
  "V1 is sold",
] as const;
