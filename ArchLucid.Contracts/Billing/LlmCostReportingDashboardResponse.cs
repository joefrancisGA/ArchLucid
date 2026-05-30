namespace ArchLucid.Contracts.Billing;

/// <summary>Tenant-scoped estimated LLM spend dashboard (Batch B item 18).</summary>
public sealed class LlmCostReportingDashboardResponse
{
    public List<LlmCostDailyBucketResponse> Daily
    {
        get;
        init;
    } = [];

    public List<LlmCostWorkspaceProjectRowResponse> ByWorkspaceProject
    {
        get;
        init;
    } = [];

    public string Currency
    {
        get;
        init;
    } = "USD";

    /// <summary>Always <c>estimated</c> — not invoiced Azure cost.</summary>
    public string CostBasisLabel
    {
        get;
        init;
    } = "estimated";

    /// <summary>Top runs by estimated trace LLM spend in the current project scope.</summary>
    public List<LlmCostTopRunRowResponse> TopRuns
    {
        get;
        init;
    } = [];
}

public sealed class LlmCostDailyBucketResponse
{
    public DateTimeOffset BucketUtc
    {
        get;
        init;
    }

    public decimal EstimatedCostUsd
    {
        get;
        init;
    }

    public long PromptTokens
    {
        get;
        init;
    }

    public long CompletionTokens
    {
        get;
        init;
    }
}

public sealed class LlmCostWorkspaceProjectRowResponse
{
    public Guid WorkspaceId
    {
        get;
        init;
    }

    public string WorkspaceName
    {
        get;
        init;
    } = string.Empty;

    public Guid ProjectId
    {
        get;
        init;
    }

    public string ProjectName
    {
        get;
        init;
    } = string.Empty;

    public decimal EstimatedCostUsd
    {
        get;
        init;
    }

    public long PromptTokens
    {
        get;
        init;
    }

    public long CompletionTokens
    {
        get;
        init;
    }
}
