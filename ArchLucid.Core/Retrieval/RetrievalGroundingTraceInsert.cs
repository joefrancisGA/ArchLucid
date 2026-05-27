namespace ArchLucid.Core.Retrieval;

/// <summary>Append-only grounding trace row for agent retrieval runs.</summary>
public sealed class RetrievalGroundingTraceInsert
{
    public Guid TenantId { get; set; }

    public Guid WorkspaceId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid RunId { get; set; }

    public string AgentName { get; set; } = null!;

    public IReadOnlyList<string> RetrievedChunkIds { get; set; } = [];

    public int? TokensIn { get; set; }

    public int? TokensOut { get; set; }

    public double CitationCoverage { get; set; }

    /// <summary>Truncated query text used for embedding (forensic replay).</summary>
    public string? QueryText { get; set; }

    public int? TopK { get; set; }

    public string? CorpusKind { get; set; }

    /// <summary>Bounded JSON array of chunk id + score summaries.</summary>
    public string? ScoresJson { get; set; }

    /// <summary>Bounded JSON array of distinct document ids from hits.</summary>
    public string? DocumentIdsJson { get; set; }

    /// <summary>Optional correlation to <c>dbo.AgentExecutionTraces</c> when known at write time.</summary>
    public string? AgentExecutionTraceId { get; set; }

    public DateTime CreatedUtc { get; set; } = TimeProvider.System.UtcNowDateTime();
}
