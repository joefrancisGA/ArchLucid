namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Buyer-safe run metadata on <see cref="BuyerRunDetailSummaryDto" /> — identifiers and flags only, no snapshot subgraphs (TB-283).
/// </summary>
public sealed class BuyerRunDetailRunDto
{
    public Guid RunId
    {
        get;
        set;
    }

    public string ProjectId
    {
        get;
        set;
    } = "";

    /// <summary>Scoped solution/project boundary (GUID). Distinct from <see cref="ProjectId" /> slug.</summary>
    public Guid ScopeProjectId
    {
        get;
        set;
    }

    public string? Description
    {
        get;
        set;
    }

    public string? DisplayName
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public Guid? GoldenManifestId
    {
        get;
        set;
    }

    public bool HasGraphSnapshot
    {
        get;
        set;
    }

    public bool HasGoldenManifest
    {
        get;
        set;
    }

    public bool HasFindingsSnapshot
    {
        get;
        set;
    }

    /// <summary>Legacy lifecycle status string (e.g. ReadyForCommit, PartiallyCompleted) for finalize honesty (TB-937).</summary>
    public string? LegacyRunStatus
    {
        get;
        set;
    }

    public bool RunDegradedExecution
    {
        get;
        set;
    }

    public IReadOnlyList<string> DegradedExecutionAgents
    {
        get;
        set;
    } = [];

    /// <summary>When <see langword="true" />, deferred authority pipeline work dead-lettered after retry exhaustion.</summary>
    public bool IsDeadLettered
    {
        get;
        set;
    }
}
