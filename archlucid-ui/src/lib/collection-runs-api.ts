import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type { components } from "@/lib/api-types/schemas.generated";

export type CollectionRun = components["schemas"]["CollectionRun"];

const COLLECTION_RUNS_PATH = "/api/proxy/v1/collection-runs";

export async function fetchCollectionRuns(limit = 50): Promise<CollectionRun[]> {
  const params = new URLSearchParams({
    offset: "0",
    limit: String(limit),
  });

  const raw = await proxyJsonGet<unknown>(`${COLLECTION_RUNS_PATH}?${params.toString()}`);

  return Array.isArray(raw)
    ? raw.filter((item): item is CollectionRun => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
}

export async function triggerCollectionRun(
  idempotencyKey: string,
  subscriptionIds: readonly string[] = [],
): Promise<CollectionRun> {
  const normalizedIdempotencyKey = idempotencyKey.trim();

  if (normalizedIdempotencyKey.length === 0) {
    throw new Error("idempotencyKey is required.");
  }

  return proxyJsonPost<CollectionRun>(
    `${COLLECTION_RUNS_PATH}:trigger`,
    { subscriptionIds: subscriptionIds.map((subscriptionId) => subscriptionId.trim()).filter(Boolean) },
    {
      headers: {
        "Idempotency-Key": normalizedIdempotencyKey,
      },
    },
  );
}
