using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Findings;

/// <summary>Dapper projection for the findings keyset metadata page (TB-929).</summary>
[ExcludeFromCodeCoverage(Justification = "Dapper row-mapping DTO with no logic.")]
internal sealed class FindingRecordMetadataSqlRow
{
    public Guid FindingRecordId
    {
        get;
        init;
    }

    public int SortOrder
    {
        get;
        init;
    }

    public string FindingId
    {
        get;
        init;
    } = null!;

    public string FindingType
    {
        get;
        init;
    } = null!;

    public string Category
    {
        get;
        init;
    } = null!;

    public string EngineType
    {
        get;
        init;
    } = null!;

    public string Severity
    {
        get;
        init;
    } = null!;

    public string Title
    {
        get;
        init;
    } = null!;

    public int? PriorityRank
    {
        get;
        init;
    }
}
