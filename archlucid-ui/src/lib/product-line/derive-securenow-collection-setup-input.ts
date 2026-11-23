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

function listedSubscriptionIds(subscriptionIds: string | null | undefined): string[] {
  return (subscriptionIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function deriveAzureSubscriptionScopeFromConnections(
  azureConnections: readonly { readonly subscriptionIds: string }[],
): { readonly azureSubscriptionIdsPresent: boolean; readonly azureSubscriptionScopeLabel: string | null } {
  // The connection list is one row per subscription. A comma-separated row still counts as several ids.
  const ids = [
    ...new Set(azureConnections.flatMap((connection) => listedSubscriptionIds(connection.subscriptionIds))),
  ];

  if (ids.length === 0) {
    return {
      azureSubscriptionIdsPresent: false,
      azureSubscriptionScopeLabel: null,
    };
  }

  return {
    azureSubscriptionIdsPresent: true,
    azureSubscriptionScopeLabel: formatAzureSubscriptionSummary(ids.join(", ")),
  };
}
