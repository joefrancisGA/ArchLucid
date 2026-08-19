namespace ArchLucid.Contracts.Explanation;

/// <summary>Redaction-safe retrieval score metadata for one retrieved chunk.</summary>
public sealed class RunRetrievalGroundingScoreSummary
{
    public string ChunkId { get; set; } = string.Empty;

    public double? Score { get; set; }
}
