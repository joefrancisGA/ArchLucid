export type RetrievalHit = {
  chunkId: string;
  documentId: string;
  corpusKind?: string;
  sourceType: string;
  sourceId: string;
  title: string;
  text: string;
  score: number;
  findingId?: string | null;
  decisionId?: string | null;
};
