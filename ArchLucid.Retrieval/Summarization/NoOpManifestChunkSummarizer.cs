using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Summarization;

/// <summary>Test/diagnostic no-op summarizer.</summary>
public sealed class NoOpManifestChunkSummarizer : IManifestChunkSummarizer
{
    public Task<IReadOnlyList<RetrievalHit>> MaybeSummarizeAsync(
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken) =>
        Task.FromResult(hits);
}
