using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Summarization;

/// <summary>Summarizes least-relevant manifest retrieval chunks when the corpus exceeds the safe token budget.</summary>
public interface IManifestChunkSummarizer
{
    Task<IReadOnlyList<RetrievalHit>> MaybeSummarizeAsync(
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken);
}
