/**
 * Shared raw-table baseline paths for TB-2382 / TB-1649 migrate inventory.
 * Keep in sync with `operator-data-table-contract.test.ts` RAW_TABLE_BASELINE.
 */
export const OPERATOR_DATA_TABLE_RAW_TABLE_BASELINE_PATHS: readonly string[] = [
  "app/(operator)/administration/users/_sections/SettingsRolesMatrixTable.tsx",
  "app/(operator)/governance/audit-evidence/AuditEvidenceLookupRecentLineageTable.tsx",
  "app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchRecentMappingsTable.tsx",
  "components/findings/FindingEvidenceGraphOutline.tsx",
  "components/governance/GovernanceEnvironmentsClient.tsx",
  "components/infra-evidence/InfraEvidenceDiagramOutline.tsx",
  "components/product-line/ProductLinePlaygroundClient.tsx",
] as const;
