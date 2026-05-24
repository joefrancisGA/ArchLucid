using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

public interface ICorpusSource
{
    CorpusKind Kind { get; }

    Task<IReadOnlyList<RetrievalDocument>> BuildDocumentsAsync(CancellationToken ct);
}
