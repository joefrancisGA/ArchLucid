namespace ArchLucid.Contracts.Operations;

public sealed class TrialFunnelCohortRowResponse
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string OrganizationName
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset? TrialStartedUtc
    {
        get;
        init;
    }

    public string CurrentStageId
    {
        get;
        init;
    } = string.Empty;

    public string CurrentStageLabel
    {
        get;
        init;
    } = string.Empty;

    public int? DaysInTrial
    {
        get;
        init;
    }

    public DateTimeOffset? LastMeaningfulActivityUtc
    {
        get;
        init;
    }

    public string FirstReviewStatus
    {
        get;
        init;
    } = string.Empty;

    public decimal? EstimatedFirstReviewCostUsd
    {
        get;
        init;
    }

    public string ConversionStatus
    {
        get;
        init;
    } = string.Empty;

    public string? AttentionLabel
    {
        get;
        init;
    }
}
