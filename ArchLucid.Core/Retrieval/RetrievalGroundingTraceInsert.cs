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

    public DateTime CreatedUtc { get; set; } = TimeProvider.System.UtcNowDateTime();
}
