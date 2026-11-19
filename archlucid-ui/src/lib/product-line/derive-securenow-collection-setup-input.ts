import { CLOUD_PROVIDER_NEUTRAL_ORDER } from "@/lib/cloud-platform-scope-storage";
import { formatAzureSubscriptionSummary } from "@/lib/azure-connection-present";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { isCloudProviderSummaryConfigured } from "@/app/(operator)/integrations/cloud-connections/_sections/is-cloud-provider-summary-configured";

type ProviderSummaryState = {
  readonly status: string;
};

export function deriveSecureNowCollectionSetupInput(input: {
  readonly providerSummaries: Record<(typeof CLOUD_PROVIDER_NEUTRAL_ORDER)[number], ProviderSummaryState>;
  readonly azureSubscriptionIdsPresent: boolean;
  readonly snapshotCaptureSucceeded: boolean | null;
}): SecureNowCollectionMissingInput {
  const hasConfiguredProvider = CLOUD_PROVIDER_NEUTRAL_ORDER.some((provider) =>
    isCloudProviderSummaryConfigured(input.providerSummaries[provider].status),
  );
  return {
    hasConfiguredProvider,
    azureSubscriptionIdsPresent: input.azureSubscriptionIdsPresent,
    hasSuccessfulPull: input.snapshotCaptureSucceeded === true,
  };
}

export function deriveAzureSubscriptionScopeFromConnections(
  azureConnections: readonly { readonly subscriptionIds: string }[],
): { readonly azureSubscriptionIdsPresent: boolean; readonly azureSubscriptionScopeLabel: string | null } {
  const firstSubscriptionIds = azureConnections.find((connection) =>
    connection.subscriptionIds.split(",").some((id) => id.trim().length > 0),
  )?.subscriptionIds;

  return {
    azureSubscriptionIdsPresent: firstSubscriptionIds !== undefined,
    azureSubscriptionScopeLabel: firstSubscriptionIds === undefined
      ? null
      : formatAzureSubscriptionSummary(firstSubscriptionIds),
  };
}
