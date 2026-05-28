namespace ArchLucid.Contracts.Explanation;

/// <summary>Operator-visible retrieval grounding row for a run, without raw prompt or retrieved content.</summary>
public sealed class RunRetrievalGroundingRow
{
    public string TraceId { get; set; } = string.Empty;

    public string? AgentName { get; set; }

    public string? CorpusKind { get; set; }

    public IReadOnlyList<string> RetrievedChunkIds { get; set; } = [];

    public IReadOnlyList<string> DocumentIds { get; set; } = [];

    public IReadOnlyList<RunRetrievalGroundingScoreSummary> ScoreSummaries { get; set; } = [];

    public int RetrievedChunkCount { get; set; }

    public int? TokensIn { get; set; }

    public int? TokensOut { get; set; }

    public double CitationCoverage { get; set; }

    public int? TopK { get; set; }

    public string? AgentExecutionTraceId { get; set; }

    public bool ScoreMetadataMalformed { get; set; }

    public bool DocumentMetadataMalformed { get; set; }

    public DateTime CreatedUtc { get; set; }
}
