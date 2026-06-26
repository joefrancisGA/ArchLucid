/** Target cloud for Tier-1 customer-controlled inventory ZIP scripts (V1 GA §2.19). */
export type CloudInventoryPlatform = "azure" | "aws" | "gcp";

export function cloudInventoryPlatformLabel(platform: CloudInventoryPlatform): string {
  switch (platform) {
    case "azure":
      return "Azure";
    case "aws":
      return "AWS";
    case "gcp":
      return "GCP";
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

export function wizardEvidenceSourceToCloudInventoryPlatform(
  sourceId: string,
): CloudInventoryPlatform | null {
  switch (sourceId) {
    case "azure-export":
      return "azure";
    case "aws-inventory":
      return "aws";
    case "gcp-inventory":
      return "gcp";
    default:
      return null;
  }
}

export function isTier1InventoryEvidenceSourceId(sourceId: string): boolean {
  return wizardEvidenceSourceToCloudInventoryPlatform(sourceId) !== null;
}
