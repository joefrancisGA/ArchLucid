using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper projection for the rollup/compare read (TB-2053). The JSON columns are <c>JSON_QUERY</c> subpaths of
///     <c>ResultJson</c>, so each arrives as a JSON array fragment rather than a typed collection.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Dapper row-mapping DTO with no logic.")]
internal sealed class AgentResultRollupProjectionRow
{
    public string ResultId
    {
        get;
        init;
    } = null!;

    public string TaskId
    {
        get;
        init;
    } = null!;

    /// <summary><c>dbo.AgentResults.RunId</c> is <c>UNIQUEIDENTIFIER</c>; mapping to string here throws in Dapper.</summary>
    public Guid RunId
    {
        get;
        init;
    }

    public string AgentType
    {
        get;
        init;
    } = null!;

    public double Confidence
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public string? ClaimsJson
    {
        get;
        init;
    }

    public string? EvidenceRefsJson
    {
        get;
        init;
    }

    public string? FindingsJson
    {
        get;
        init;
    }

    public string? RequiredControlsJson
    {
        get;
        init;
    }

    public string? WarningsJson
    {
        get;
        init;
    }
}
