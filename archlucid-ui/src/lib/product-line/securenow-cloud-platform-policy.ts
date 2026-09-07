import type { CloudPlatformScope, CloudProviderId } from "@/lib/cloud-platform-scope-storage";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** SecureNow ships Azure cloud connectors only — not AWS or GCP. */
export const SECURENOW_SUPPORTED_CLOUD_PROVIDERS: readonly CloudProviderId[] = ["azure"];

export const SECURENOW_EXCLUDED_HELP_TOPIC_SLUGS: readonly string[] = [
  "cloud-connections-aws",
  "cloud-connections-gcp",
];

export const SECURENOW_EXCLUDED_HELP_SEARCH_TOPIC_IDS: readonly string[] = [
  "connect-aws",
  "connect-gcp",
];

export function isSecureNowProductLine(productLineId: ProductLineId): boolean {
  return productLineId === "security";
}

export function isCloudProviderSupportedForProductLine(
  provider: CloudProviderId,
  productLineId: ProductLineId,
): boolean {
  if (!isSecureNowProductLine(productLineId)) {
    return true;
  }

  return SECURENOW_SUPPORTED_CLOUD_PROVIDERS.includes(provider);
}

export function filterCloudProvidersForProductLine(
  providers: readonly CloudProviderId[],
  productLineId: ProductLineId,
): CloudProviderId[] {
  return providers.filter((provider) => isCloudProviderSupportedForProductLine(provider, productLineId));
}

export function isHelpTopicExcludedForProductLine(slug: string, productLineId: ProductLineId): boolean {
  if (!isSecureNowProductLine(productLineId)) {
    return false;
  }

  return SECURENOW_EXCLUDED_HELP_TOPIC_SLUGS.includes(slug);
}

export function isHelpSearchTopicExcludedForProductLine(topicId: string, productLineId: ProductLineId): boolean {
  if (!isSecureNowProductLine(productLineId)) {
    return false;
  }

  return SECURENOW_EXCLUDED_HELP_SEARCH_TOPIC_IDS.includes(topicId);
}

export function isCloudConnectionPathExcludedForProductLine(
  pathname: string,
  productLineId: ProductLineId,
): boolean {
  if (!isSecureNowProductLine(productLineId)) {
    return false;
  }

  const normalized = pathname.replace(/\/$/, "");

  return normalized.endsWith("/integrations/cloud-connections/aws")
    || normalized.endsWith("/integrations/cloud-connections/gcp")
    || normalized.endsWith("/help/cloud-connections/aws")
    || normalized.endsWith("/help/cloud-connections/gcp");
}

/** Preferences and hub cards must not surface unsupported providers in SecureNow. */
export function effectiveCloudPlatformScopeForProductLine(
  scope: CloudPlatformScope,
  productLineId: ProductLineId,
): CloudPlatformScope {
  if (!isSecureNowProductLine(productLineId)) {
    return scope;
  }

  return {
    ...scope,
    aws: false,
    gcp: false,
    azure: true,
  };
}

export function secureNowCloudConnectionsSummary(): string {
  return "Connect Azure for read-only evidence collection and connector health checks in SecureNow.";
}

export function secureNowCloudInventoryEvidenceSummary(): string {
  return "Connect Azure for read-only cloud inventory evidence collection.";
}

export function architectureCloudConnectionsSummary(): string {
  return "Connect Azure, AWS, or GCP for read-only evidence collection and connector health checks.";
}

export function cloudConnectionsSummaryForProductLine(productLineId: ProductLineId): string {
  if (isSecureNowProductLine(productLineId)) {
    return secureNowCloudConnectionsSummary();
  }

  return architectureCloudConnectionsSummary();
}

export function secureNowCloudConnectionsHelpSubtitle(): string {
  return "Optional Azure connector for read-only evidence — or run evidence-only reviews without any cloud connector.";
}

export function architectureCloudConnectionsHelpSubtitle(): string {
  return "Optional Azure, AWS, and GCP connectors for read-only evidence — or run evidence-only reviews without any cloud connector.";
}

export function cloudConnectionsHelpSubtitleForProductLine(productLineId: ProductLineId): string {
  if (isSecureNowProductLine(productLineId)) {
    return secureNowCloudConnectionsHelpSubtitle();
  }

  return architectureCloudConnectionsHelpSubtitle();
}

export function secureNowCloudConnectionsHubContextualLead(): string {
  return "Connect Azure for optional read-only evidence collection, or start evidence-only reviews without a cloud connector.";
}

export function architectureCloudConnectionsHubContextualLead(): string {
  return "Connect Azure, AWS, or Google Cloud for optional read-only evidence collection, or start evidence-only reviews without a cloud connector.";
}

export function cloudConnectionsHubContextualLeadForProductLine(productLineId: ProductLineId): string {
  if (isSecureNowProductLine(productLineId)) {
    return secureNowCloudConnectionsHubContextualLead();
  }

  return architectureCloudConnectionsHubContextualLead();
}
