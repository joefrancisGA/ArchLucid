export type RunRetrievalGroundingScoreSummary = {
  chunkId: string;
  score?: number | null;
};

export type RunRetrievalGroundingRow = {
  traceId: string;
  agentName?: string | null;
  corpusKind?: string | null;
  retrievedChunkIds: string[];
  documentIds: string[];
  scoreSummaries: RunRetrievalGroundingScoreSummary[];
  retrievedChunkCount: number;
  tokensIn?: number | null;
  tokensOut?: number | null;
  citationCoverage: number;
  topK?: number | null;
  agentExecutionTraceId?: string | null;
  graphRagNeighborsAdded?: number | null;
  graphRagSeedHits?: number | null;
  graphRagExpansionLatencyMs?: number | null;
  scoreMetadataMalformed: boolean;
  documentMetadataMalformed: boolean;
  createdUtc: string;
};

export type RunRetrievalGroundingPayload = {
  runId: string;
  rows: RunRetrievalGroundingRow[];
  traceCount: number;
  hasDegradedMetadata: boolean;
};
