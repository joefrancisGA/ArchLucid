namespace ArchLucid.Core.Retrieval;

/// <summary>Fast, cheap LLM summarization for oversized manifest retrieval chunks.</summary>
public interface IManifestChunkSummaryCompletionClient
{
    Task<string> SummarizeChunkAsync(string chunkText, CancellationToken cancellationToken);
}
