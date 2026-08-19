namespace ArchLucid.Core.Budgeting;

/// <summary>Post-call application of measured usage and release of any pre-call reservation.</summary>
public sealed class LlmTenantBudgetSettleRequest
{
    public Guid TenantId
    {
        get;
        init;
    }

    public LlmBudgetPeriod Period
    {
        get;
        init;
    }

    public string PeriodKey
    {
        get;
        init;
    } = "";

    public long ActualTokens
    {
        get;
        init;
    }

    public decimal ActualUsd
    {
        get;
        init;
    }

    public long ReleaseReservedTokens
    {
        get;
        init;
    }

    public decimal ReleaseReservedUsd
    {
        get;
        init;
    }

    public long WarnAtTokens
    {
        get;
        init;
    }

    public decimal WarnAtUsd
    {
        get;
        init;
    }

    public byte[] ExpectedRowVersion
    {
        get;
        init;
    } = [];
}
