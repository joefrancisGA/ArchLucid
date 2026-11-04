import { cloudConnectionIndicatesSuccessfulPull } from "@/lib/cloud-first-inventory-coach";
import { CLOUD_PROVIDER_NEUTRAL_ORDER } from "@/lib/cloud-platform-scope-storage";
import { formatAzureSubscriptionSummary } from "@/lib/azure-connection-present";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { isCloudProviderSummaryConfigured } from "@/app/(operator)/integrations/cloud-connections/_sections/is-cloud-provider-summary-configured";

type ProviderSummaryState = {
  readonly status: string;
};

type SuccessfulPullByProvider = Record<(typeof CLOUD_PROVIDER_NEUTRAL_ORDER)[number], boolean>;

export function deriveSecureNowCollectionSetupInput(input: {
  readonly providerSummaries: Record<(typeof CLOUD_PROVIDER_NEUTRAL_ORDER)[number], ProviderSummaryState>;
  readonly successfulPullByProvider: SuccessfulPullByProvider;
  readonly azureSubscriptionIdsPresent: boolean;
  readonly snapshotCaptureSucceeded: boolean | null;
}): SecureNowCollectionMissingInput {
  const hasConfiguredProvider = CLOUD_PROVIDER_NEUTRAL_ORDER.some((provider) =>
    isCloudProviderSummaryConfigured(input.providerSummaries[provider].status),
  );
  const hasSuccessfulPullFromConnections = CLOUD_PROVIDER_NEUTRAL_ORDER.some(
    (provider) => input.successfulPullByProvider[provider],
  );
  const hasSuccessfulPull =
    input.snapshotCaptureSucceeded === null
      ? hasSuccessfulPullFromConnections
      : input.snapshotCaptureSucceeded;

  return {
    hasConfiguredProvider,
    azureSubscriptionIdsPresent: input.azureSubscriptionIdsPresent,
    hasSuccessfulPull,
  };
}

export function deriveAzureSubscriptionScopeFromConnections(
  azureConnections: readonly { readonly subscriptionIds: string }[],
): { readonly azureSubscriptionIdsPresent: boolean; readonly azureSubscriptionScopeLabel: string | null } {
  const subscriptionIdsPresent = azureConnections.some(
    (connection) => connection.subscriptionIds.trim().length > 0,
  );
  const firstSubscriptionIds =
    azureConnections.find((connection) => connection.subscriptionIds.trim().length > 0)?.subscriptionIds ?? "";

  return {
    azureSubscriptionIdsPresent: subscriptionIdsPresent,
    azureSubscriptionScopeLabel: subscriptionIdsPresent
      ? formatAzureSubscriptionSummary(firstSubscriptionIds)
      : null,
  };
}

export function deriveAzureSuccessfulPullFromConnections(
  azureConnections: readonly { readonly updatedUtc: string | null }[],
): boolean {
  return azureConnections.some((connection) =>
    cloudConnectionIndicatesSuccessfulPull({
      lastPolledUtc: connection.updatedUtc ?? null,
    }),
  );
}
