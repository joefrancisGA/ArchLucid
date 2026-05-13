export type RetrievalHit = {
  chunkId: string;
  documentId: string;
  sourceType: string;
  sourceId: string;
  title: string;
  text: string;
  score: number;
};
