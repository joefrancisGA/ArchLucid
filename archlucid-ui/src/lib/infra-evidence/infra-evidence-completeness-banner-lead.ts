import { AzureInventoryRelationshipCompletenessWarningCodes } from "@/lib/infra-evidence/azure-inventory-completeness-warning-codes";

const AUTHORIZATION_LEAD =
  "These warnings do not block rendering. Connection lines may be missing or weaker than the underlying authorization facts.";

const COLLECTION_GAP_LEAD =
  "These warnings do not block rendering. Some connection lines were not collected. A missing line is not a stored finding that the relationship does not exist.";

const COMPANION_METADATA_LEAD =
  "These warnings do not block rendering. Companion metadata may be missing or incomplete on this diagram. They do not imply a connection line was evaluated.";

const COMPANION_METADATA_PREFIXES = [
  "defender-",
  "policy-compliance-",
  "governance-status-",
] as const;

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

  const hasCompanionMetadata = warnings.some((warning) => {
    const trimmed = warning.trim().toLowerCase();

    return COMPANION_METADATA_PREFIXES.some(
      (prefix) => trimmed === prefix || trimmed.startsWith(prefix),
    );
  });

  if (hasCompanionMetadata) {
    return COMPANION_METADATA_LEAD;
  }

  return AUTHORIZATION_LEAD;
}
