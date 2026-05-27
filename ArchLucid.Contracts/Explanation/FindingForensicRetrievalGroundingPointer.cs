namespace ArchLucid.Contracts.Explanation;

/// <summary>Retrieval grounding trace pointer for finding forensic read.</summary>
public sealed class FindingForensicRetrievalGroundingPointer
{
    public string TraceId { get; set; } = string.Empty;

    public string? AgentName { get; set; }

    public string? CorpusKind { get; set; }

    public double CitationCoverage { get; set; }

    public string? AgentExecutionTraceId { get; set; }
}
