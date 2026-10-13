import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type { components } from "@/lib/api-types/schemas.generated";

export type CollectionRun = components["schemas"]["CollectionRun"];

const COLLECTION_RUNS_PATH = "/api/proxy/v1/collection-runs";

export async function fetchCollectionRuns(limit = 50): Promise<CollectionRun[]> {
  const params = new URLSearchParams({
    offset: "0",
    limit: String(limit),
  });

  return proxyJsonGet<CollectionRun[]>(`${COLLECTION_RUNS_PATH}?${params.toString()}`);
}

export async function triggerCollectionRun(
  idempotencyKey: string,
  subscriptionIds: readonly string[] = [],
): Promise<CollectionRun> {
  return proxyJsonPost<CollectionRun>(
    `${COLLECTION_RUNS_PATH}:trigger`,
    { subscriptionIds },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );
}
