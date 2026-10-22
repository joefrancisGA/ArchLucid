using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Findings;

/// <summary>Dapper projection for the coverage-only <c>dbo.FindingsSnapshots</c> header (TB-930).</summary>
[ExcludeFromCodeCoverage(Justification = "Dapper row-mapping DTO with no logic.")]
internal sealed class FindingsCoverageHeaderRow
{
    public Guid FindingsSnapshotId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public Guid ContextSnapshotId
    {
        get;
        init;
    }

    public Guid GraphSnapshotId
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public int SchemaVersion
    {
        get;
        init;
    }

    public string? GenerationStatus
    {
        get;
        init;
    }

    /// <summary>Raw <c>JSON_QUERY</c> fragment for engine failures; may be corrupt on legacy rows.</summary>
    public string? EngineFailuresJson
    {
        get;
        init;
    }

    public bool? EvaluationConfidenceEnrichmentSkipped
    {
        get;
        init;
    }
}
