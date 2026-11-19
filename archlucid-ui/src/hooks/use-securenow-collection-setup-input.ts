"use client";

import { useQuery } from "@tanstack/react-query";

import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import {
  deriveAzureSubscriptionScopeFromConnections,
  deriveSecureNowCollectionSetupInput,
} from "@/lib/product-line/derive-securenow-collection-setup-input";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { resolveCollectionSnapshotCaptureSucceeded } from "@/lib/product-line/resolve-collection-snapshot-capture-succeeded";

const DEFAULT_PROVIDER_SUMMARY = {
  status: "Not configured",
} as const;

async function readSnapshotCaptureStatuses(
  signal: AbortSignal,
): Promise<readonly (number | string | null | undefined)[] | null> {
  try {
    let pageNumber = 1;

    while (true) {
      signal.throwIfAborted();
      const page = await fetchInfraEvidenceSnapshots(pageNumber, 20);
      const statuses = (page.items ?? []).map((item) => item.captureStatus);
      if (!page.hasMore || statuses.some(isInfraEvidenceSnapshotCaptureSucceeded)) {
        return statuses;
      }

      pageNumber += 1;
    }
  } catch {
    signal.throwIfAborted();
    return null;
  }
}

export function useSecureNowCollectionSetupInput(input: {
  readonly snapshotCaptureSucceeded: boolean | null;
  readonly enabled?: boolean;
}): {
  readonly collectionInput: SecureNowCollectionMissingInput | null;
  readonly isPending: boolean;
  readonly isError: boolean;
} {
  const query = useQuery({
    queryKey: ["securenow", "collection-setup-input", input.snapshotCaptureSucceeded],
    queryFn: async ({ signal }) => {
      const azureConnections = await listTier2Connections();
      const azureScope = deriveAzureSubscriptionScopeFromConnections(azureConnections);
      const providerSummaries = {
        azure: azureConnections.length > 0 ? { status: "Configured" } : DEFAULT_PROVIDER_SUMMARY,
        aws: DEFAULT_PROVIDER_SUMMARY,
        gcp: DEFAULT_PROVIDER_SUMMARY,
      };
      const snapshotCaptureStatuses = input.snapshotCaptureSucceeded === true
        ? null
        : await readSnapshotCaptureStatuses(signal);
      const snapshotCaptureSucceeded = resolveCollectionSnapshotCaptureSucceeded({
        callerSnapshotCaptureSucceeded: input.snapshotCaptureSucceeded,
        snapshotCaptureStatuses,
      });

      return deriveSecureNowCollectionSetupInput({
        providerSummaries,
        azureSubscriptionIdsPresent: azureScope.azureSubscriptionIdsPresent,
        snapshotCaptureSucceeded,
      });
    },
    enabled: input.enabled !== false,
    retry: false,
  });

  if (query.isPending) {
    return { collectionInput: null, isPending: true, isError: false };
  }

  if (query.isError) {
    return { collectionInput: null, isPending: false, isError: true };
  }

  return { collectionInput: query.data ?? null, isPending: false, isError: false };
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
  return deriveSecureNowCollectionSetupInput({
    providerSummaries,
    azureSubscriptionIdsPresent: input.subscriptionLabelPresent,
    snapshotCaptureSucceeded: input.snapshotCaptureSucceeded,
  });
}
