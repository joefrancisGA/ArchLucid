namespace ArchLucid.Core.Retrieval;

/// <summary>Read model for one persisted retrieval grounding trace row.</summary>
public sealed class RetrievalGroundingTraceRecord
{
    public Guid TraceId { get; set; }

    public Guid TenantId { get; set; }

    public Guid WorkspaceId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid RunId { get; set; }

    public string AgentName { get; set; } = null!;

    public IReadOnlyList<string> RetrievedChunkIds { get; set; } = [];

    public int? TokensIn { get; set; }

    public int? TokensOut { get; set; }

    public double CitationCoverage { get; set; }

    public string? QueryText { get; set; }

    public int? TopK { get; set; }

    public string? CorpusKind { get; set; }

    public string? ScoresJson { get; set; }

    public string? DocumentIdsJson { get; set; }

    public string? AgentExecutionTraceId { get; set; }

    public int? GraphRagNeighborsAdded { get; set; }

    public int? GraphRagSeedHits { get; set; }

    public double? GraphRagExpansionLatencyMs { get; set; }

    public int? IterativeRetrievalRounds { get; set; }

    public string? IterativeCritiqueDecisionsJson { get; set; }

    public DateTime CreatedUtc { get; set; }
}
