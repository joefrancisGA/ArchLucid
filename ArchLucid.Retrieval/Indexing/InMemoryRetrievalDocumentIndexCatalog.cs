using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>In-process catalog for dev, tests, and single-node retrieval indexing.</summary>
public sealed class InMemoryRetrievalDocumentIndexCatalog : IRetrievalDocumentIndexCatalog
{
    private readonly Dictionary<string, RetrievalDocumentIndexState> _states = new(StringComparer.Ordinal);

    private readonly Lock _sync = new();

    public bool TryGet(string documentId, out RetrievalDocumentIndexState state)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(documentId);

        lock (_sync)
        {
            return _states.TryGetValue(documentId, out state!);
        }
    }

    public void RecordIndexed(RetrievalDocument document, string chunkingFingerprint, DateTimeOffset indexedUtc)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (string.IsNullOrWhiteSpace(document.DocumentId))
            throw new ArgumentException("Document id is required.", nameof(document));

        lock (_sync)
        {
            _states[document.DocumentId] = new RetrievalDocumentIndexState
            {
                ContentHash = document.ContentHash ?? string.Empty,
                ChunkingFingerprint = chunkingFingerprint,
                LastIndexedUtc = indexedUtc,
            };
        }
    }

    public void Remove(string documentId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(documentId);

        lock (_sync)
        {
            _states.Remove(documentId);
        }
    }
}
