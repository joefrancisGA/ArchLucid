/**
 * Shared raw-table baseline paths for TB-2382 / TB-1649 migrate inventory.
 * Keep in sync with `operator-data-table-contract.test.ts` RAW_TABLE_BASELINE.
 */
export const OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS: readonly string[] = [
  "app/(operator)/administration/identity-providers/_sections/IdentityProvidersCatalogTable.tsx",
  "app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.tsx",
  "app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx",
  "app/(operator)/administration/users/_sections/SettingsRolesMatrixSection.tsx",
  "app/(operator)/governance/policy-packs/_sections/CuratedRulesAuthoringSection.tsx",
  "app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportPageView.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/AwsTrustPolicyStarterPanel.tsx",
  "components/provenance/ProvenancePageWorkspace.tsx",
] as const;
