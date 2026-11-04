"use client";

import { useQuery } from "@tanstack/react-query";

import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import {
  deriveAzureSubscriptionScopeFromConnections,
  deriveAzureSuccessfulPullFromConnections,
  deriveSecureNowCollectionSetupInput,
} from "@/lib/product-line/derive-securenow-collection-setup-input";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";

const DEFAULT_PROVIDER_SUMMARY = {
  status: "Not configured",
} as const;

export function useSecureNowCollectionSetupInput(input: {
  readonly snapshotCaptureSucceeded: boolean | null;
  readonly enabled?: boolean;
}): {
  readonly collectionInput: SecureNowCollectionMissingInput | null;
  readonly isPending: boolean;
} {
  const query = useQuery({
    queryKey: ["securenow", "collection-setup-input"],
    queryFn: async () => {
      const azureConnections = await listTier2Connections();
      const azureScope = deriveAzureSubscriptionScopeFromConnections(azureConnections);
      const azurePullSucceeded = deriveAzureSuccessfulPullFromConnections(azureConnections);
      const providerSummaries = {
        azure: azureConnections.length > 0 ? { status: "Configured" } : DEFAULT_PROVIDER_SUMMARY,
        aws: DEFAULT_PROVIDER_SUMMARY,
        gcp: DEFAULT_PROVIDER_SUMMARY,
      };
      const successfulPullByProvider = {
        azure: azurePullSucceeded,
        aws: false,
        gcp: false,
      };

      return deriveSecureNowCollectionSetupInput({
        providerSummaries,
        successfulPullByProvider,
        azureSubscriptionIdsPresent: azureScope.azureSubscriptionIdsPresent,
        snapshotCaptureSucceeded: input.snapshotCaptureSucceeded,
      });
    },
    enabled: input.enabled !== false,
    retry: false,
  });

  if (query.isPending || query.isError) {
    return { collectionInput: null, isPending: query.isPending };
  }

  return { collectionInput: query.data ?? null, isPending: false };
}

/** Buyer-safe fallback when cloud connection status has not loaded yet on Home. */
export function resolveSecureNowHomeCollectionSetupFallbackInput(input: {
  readonly snapshotCaptureSucceeded: boolean | null;
  readonly subscriptionLabelPresent: boolean;
}): SecureNowCollectionMissingInput {
  const providerSummaries = {
    azure: DEFAULT_PROVIDER_SUMMARY,
    aws: DEFAULT_PROVIDER_SUMMARY,
    gcp: DEFAULT_PROVIDER_SUMMARY,
  };
  const successfulPullByProvider = {
    azure: false,
    aws: false,
    gcp: false,
  };

  return deriveSecureNowCollectionSetupInput({
    providerSummaries,
    successfulPullByProvider,
    azureSubscriptionIdsPresent: input.subscriptionLabelPresent,
    snapshotCaptureSucceeded: input.snapshotCaptureSucceeded,
  });
}
