using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>Tracks per-document index state for ContentHash skip and chunking invalidation.</summary>
public interface IRetrievalDocumentIndexCatalog
{
    bool TryGet(string documentId, out RetrievalDocumentIndexState state);

    void RecordIndexed(RetrievalDocument document, string chunkingFingerprint, DateTimeOffset indexedUtc);

    void Remove(string documentId);
}
