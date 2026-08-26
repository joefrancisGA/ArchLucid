"use client";

import { listDigestDeliveryAttemptsBatch } from "@/lib/api/advisory-digests-api";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";

export type DigestDeliveryAttemptsBatchResult = Record<string, DigestDeliveryAttempt[]>;

async function fetchDigestDeliveryAttemptsBatch(
  digestIds: readonly string[],
): Promise<DigestDeliveryAttemptsBatchResult> {
  const nextAttempts: DigestDeliveryAttemptsBatchResult = {};

  try {
    const batch = await listDigestDeliveryAttemptsBatch([...digestIds]);

    for (const item of batch) {
      nextAttempts[item.digestId] = item.attempts ?? [];
    }
  } catch {
    for (const digestId of digestIds) {
      nextAttempts[digestId] = [];
    }
  }

  return nextAttempts;
}

type UseDigestDeliveryAttemptsBatchQueryOptions = {
  readonly enabled?: boolean;
};

export function useDigestDeliveryAttemptsBatchQuery(
  digestIds: readonly string[],
  options?: UseDigestDeliveryAttemptsBatchQueryOptions,
) {
  const digestIdsKey = digestIds.join(",");

  return useOperatorQueryHook<DigestDeliveryAttemptsBatchResult>({
    queryKey: operatorQueryKeys.digestDeliveryAttemptsBatch(digestIdsKey),
    queryFn: () => fetchDigestDeliveryAttemptsBatch(digestIds),
    enabled: (options?.enabled ?? true) && digestIds.length > 0,
  });
}
