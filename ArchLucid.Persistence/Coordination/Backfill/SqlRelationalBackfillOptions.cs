using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Which authority JSON payloads to scan during a one-time relational backfill.</summary>
[ExcludeFromCodeCoverage(Justification = "Backfill options DTO; no logic.")]
public sealed class SqlRelationalBackfillOptions
{
    public bool ContextSnapshots
    {
        get;
        init;
    } = true;

    public bool GraphSnapshots
    {
        get;
        init;
    } = true;

    public bool FindingsSnapshots
    {
        get;
        init;
    } = true;

    public bool GoldenManifestsPhase1
    {
        get;
        init;
    } = true;

    public bool ArtifactBundles
    {
        get;
        init;
    } = true;

    /// <summary>Keyset page size for header scans (TB-085). Default 500.</summary>
    public int BatchSize
    {
        get;
        init;
    } = 500;

    /// <summary>Skip entities after this many recorded failures unless <see cref="ForceRetry"/> (TB-086).</summary>
    public int MaxRetries
    {
        get;
        init;
    } = 3;

    /// <summary>When true, quarantined entities are retried regardless of failure count (TB-086).</summary>
    public bool ForceRetry
    {
        get;
        init;
    }
}
