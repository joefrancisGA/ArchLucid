namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper row for the paged summary read. Projects the typed columns dual-written alongside <c>TraceJson</c>
///     (TB-931) so list surfaces never deserialize a full trace blob. <c>TotalCount</c> is a window aggregate repeated
///     on every row.
/// </summary>
internal sealed class AgentExecutionTraceSummaryPageRow
{
    public string TraceId
    {
        get;
        init;
    } = string.Empty;

    public Guid RunId
    {
        get;
        init;
    }

    public string TaskId
    {
        get;
        init;
    } = string.Empty;

    public string AgentType
    {
        get;
        init;
    } = string.Empty;

    public bool ParseSucceeded
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public string? ModelDeploymentName
    {
        get;
        init;
    }

    public bool? BlobUploadFailed
    {
        get;
        init;
    }

    public int? InputTokenCount
    {
        get;
        init;
    }

    public int? OutputTokenCount
    {
        get;
        init;
    }

    public decimal? EstimatedCostUsd
    {
        get;
        init;
    }

    public string? ModelAlias
    {
        get;
        init;
    }

    public bool QualityWarning
    {
        get;
        init;
    }

    public bool QualityRejected
    {
        get;
        init;
    }

    public int TotalCount
    {
        get;
        init;
    }
}
