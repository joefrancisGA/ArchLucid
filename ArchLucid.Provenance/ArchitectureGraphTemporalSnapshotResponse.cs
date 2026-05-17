namespace ArchLucid.Provenance;

/// <summary>
///     Architecture knowledge graph reconstructed for a temporal <c>as-of</c> instant, anchored to an authority review run’s
///     project lineage.
/// </summary>
/// <remarks>
///     Returned by <c>GET /v1/graph/snapshot</c>. Property names serialize in camelCase for JSON clients under default API
///     settings.
/// </remarks>
public sealed class ArchitectureGraphTemporalSnapshotResponse
{
    /// <summary>Run whose stored <c>GraphSnapshot</c> is returned in <see cref="Graph" />.</summary>
    public Guid ResolvedRunId
    {
        get;
        set;
    }

    /// <summary>Normalized as-of boundary (UTC) used for resolution.</summary>
    public DateTimeOffset AsOfUtc
    {
        get;
        set;
    }

    /// <summary><see cref="ArchLucid.Persistence.Models.RunRecord.CreatedUtc"/> of <see cref="ResolvedRunId" /> (UTC).</summary>
    public DateTime ResolvedRunCreatedUtc
    {
        get;
        set;
    }

    /// <summary>Architecture graph projected for <see cref="ResolvedRunId" />.</summary>
    public GraphViewModel Graph
    {
        get;
        set;
    } = null!;
}
