import { AzureInventoryRelationshipCompletenessWarningCodes } from "@/lib/infra-evidence/azure-inventory-completeness-warning-codes";

const AUTHORIZATION_LEAD =
  "These warnings do not block rendering. Connection lines may be missing or weaker than the underlying authorization facts.";

const COLLECTION_GAP_LEAD =
  "These warnings do not block rendering. Some connection lines were not collected. A missing line is not a stored finding that the relationship does not exist.";

const COLLECTION_GAP_PREFIXES = [
  AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing,
  AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsNotCollected,
  AzureInventoryRelationshipCompletenessWarningCodes.FabricCapacityAssignmentsNotCollected,
  AzureInventoryRelationshipCompletenessWarningCodes.StaticSiteBackendsNotCollected,
  AzureInventoryRelationshipCompletenessWarningCodes.AksWorkloadImagesNotCollectedCustomerScript,
  AzureInventoryRelationshipCompletenessWarningCodes.AksWorkloadImagesNotCollectedHosted,
  "diagnostic-destination-unresolved",
] as const;

export function resolveInfraEvidenceCompletenessBannerLead(warnings: readonly string[]): string {
  const hasCollectionGap = warnings.some((warning) => {
    const trimmed = warning.trim();

    return COLLECTION_GAP_PREFIXES.some(
      (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}:`),
    );
  });

  if (hasCollectionGap) {
    return COLLECTION_GAP_LEAD;
  }

  return AUTHORIZATION_LEAD;
}
