namespace ArchLucid.Retrieval.Indexing;

/// <summary>Embedding model fingerprint stored in a vector index (TB-045).</summary>
public sealed record VectorIndexEmbeddingMetadata(string ModelId, int Dimension, int ChunkCount);
