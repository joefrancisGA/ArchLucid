namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     Sponsor-oriented rollup of persisted pilot telemetry for the current tenant workspace scope (Committed runs plus
///     governance/export signals).
/// </summary>
public sealed class PilotReportCard
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ScopeProjectId
    {
        get;
        init;
    }

    /// <summary>Minimum <c>Run.CreatedUtc</c> among qualifying completed runs (null when none).</summary>
    public DateTimeOffset? PeriodStartUtc
    {
        get;
        init;
    }

    /// <summary>
    ///     Maximum reconciliation instant among qualifying rows: golden manifest committed time when present, otherwise
    ///     run terminal time, otherwise run creation (null when no runs match).
    /// </summary>
    public DateTimeOffset? PeriodEndUtc
    {
        get;
        init;
    }

    /// <summary>Runs satisfying the same durable committed-manifest predicate used by tenant pilot scorecards.</summary>
    public int TotalCompletedRuns
    {
        get;
        init;
    }

    /// <summary>Average wall seconds from authority run creation to golden manifest persisted instant (committed rows only).</summary>
    public double? AverageRequestToCommitWallSeconds
    {
        get;
        init;
    }

    public int TotalFindings
    {
        get;
        init;
    }

    public IReadOnlyList<PilotReportCardFindingSeverity> FindingsBySeverity
    {
        get;
        init;
    }
        = Array.Empty<PilotReportCardFindingSeverity>();

    public int GovernanceApprovalActions
    {
        get;
        init;
    }

    public int GovernanceRejections
    {
        get;
        init;
    }

    public long ExportsGenerated
    {
        get;
        init;
    }

    public int UniqueSynthesizedArtifactTypes
    {
        get;
        init;
    }
}
