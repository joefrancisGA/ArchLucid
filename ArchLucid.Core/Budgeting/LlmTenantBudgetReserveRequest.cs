namespace ArchLucid.Core.Budgeting;

/// <summary>Pre-call hold of assumed LLM usage against durable caps (INV-004).</summary>
public sealed class LlmTenantBudgetReserveRequest
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

    public long ReserveTokens
    {
        get;
        init;
    }

    public decimal ReserveUsd
    {
        get;
        init;
    }

    public long? HardCapTokens
    {
        get;
        init;
    }

    public decimal? HardCapUsd
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
