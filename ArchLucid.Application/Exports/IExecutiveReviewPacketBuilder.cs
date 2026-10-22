namespace ArchLucid.Application.Exports;

/// <summary>Builds the consolidated sponsor sponsor review packet for one committed run (Batch B / item 11).</summary>
public interface ISponsorReviewPacketBuilder
{
    /// <summary>Returns Markdown, or <see langword="null"/> when the run does not exist.</summary>
    Task<string?> BuildMarkdownAsync(string runId, CancellationToken cancellationToken = default);
}
