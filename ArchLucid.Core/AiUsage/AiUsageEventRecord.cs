namespace ArchLucid.Core.AiUsage;

public sealed class AiUsageEventRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string? UserId
    {
        get;
        init;
    }

    public AiUsageFeature Feature
    {
        get;
        init;
    }

    public string ProviderKind
    {
        get;
        init;
    } = string.Empty;

    public int InputTokens
    {
        get;
        init;
    }

    public int OutputTokens
    {
        get;
        init;
    }

    public decimal EstimatedCostUsd
    {
        get;
        init;
    }

    public decimal? ActualCostUsd
    {
        get;
        init;
    }

    public DateTimeOffset OccurredUtc
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public bool ServedFromDemoCache
    {
        get;
        init;
    }

    public bool BudgetBlocked
    {
        get;
        init;
    }
}
