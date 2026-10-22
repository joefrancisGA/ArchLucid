using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Explanation;

/// <summary>Operator-visible retrieval grounding row for a run, without raw prompt or retrieved content.</summary>
public sealed class RunRetrievalGroundingRow
{
    public string TraceId { get; set; } = string.Empty;

    public string? AgentName { get; set; }

    public string? CorpusKind { get; set; }

    private IReadOnlyList<string> retrievedChunkIds = [];

    public IReadOnlyList<string> RetrievedChunkIds
    {
        get => retrievedChunkIds;
        set => retrievedChunkIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> documentIds = [];

    public IReadOnlyList<string> DocumentIds
    {
        get => documentIds;
        set => documentIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<RunRetrievalGroundingScoreSummary> scoreSummaries = [];

    public IReadOnlyList<RunRetrievalGroundingScoreSummary> ScoreSummaries
    {
        get => scoreSummaries;
        set => scoreSummaries = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public int RetrievedChunkCount { get; set; }

    public int? TokensIn { get; set; }

    public int? TokensOut { get; set; }

    public double CitationCoverage { get; set; }

    public int? TopK { get; set; }

    public string? AgentExecutionTraceId { get; set; }

    public bool ScoreMetadataMalformed { get; set; }

    public bool DocumentMetadataMalformed { get; set; }

    public int? GraphRagNeighborsAdded { get; set; }

    public int? GraphRagSeedHits { get; set; }

    public double? GraphRagExpansionLatencyMs { get; set; }

    public DateTime CreatedUtc { get; set; }
}
