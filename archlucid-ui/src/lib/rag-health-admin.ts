export type AdminRagCorpusHealthItem = {
  corpusKind: string;
  chunkCount: number;
  lastIndexedUtc: string | null;
  embeddingDimension: number;
  isStale: boolean;
};

export type AdminRagHealthResponse = {
  embeddingModelId: string;
  corpora: AdminRagCorpusHealthItem[];
};

export async function fetchAdminRagHealth(): Promise<AdminRagHealthResponse> {
  const res = await fetch("/api/proxy/v1/internal/rag-health", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`rag-health ${res.status}`);
  }

  const json = (await res.json()) as {
    embeddingModelId?: string;
    corpora?: Array<{
      corpusKind?: string;
      chunkCount?: number;
      lastIndexedUtc?: string | null;
      embeddingDimension?: number;
      isStale?: boolean;
    }>;
  };

  return {
    embeddingModelId: json.embeddingModelId ?? "",
    corpora: (json.corpora ?? []).map((row) => ({
      corpusKind: row.corpusKind ?? "",
      chunkCount: row.chunkCount ?? 0,
      lastIndexedUtc: row.lastIndexedUtc ?? null,
      embeddingDimension: row.embeddingDimension ?? 0,
      isStale: row.isStale ?? false,
    })),
  };
}
