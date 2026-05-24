namespace ArchLucid.Contracts.Reports;

/// <summary>Breakdown of ingested Azure resource types from the latest golden manifest.</summary>
public sealed class ResourceCoverageReportResponse
{
    public IReadOnlyList<ResourceCoverageRow> Rows
    {
        get;
        init;
    } = [];
}

/// <summary>Count of resources for one Azure provider namespace/type.</summary>
public sealed class ResourceCoverageRow
{
    public required string ResourceType
    {
        get;
        init;
    }

    public int Count
    {
        get;
        init;
    }
}
