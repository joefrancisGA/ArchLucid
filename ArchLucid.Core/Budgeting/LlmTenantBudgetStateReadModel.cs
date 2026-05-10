namespace ArchLucid.Core.Budgeting;

/// <summary>Materialized LLM budget counters for a tenant bucket (UTC day or UTC month).</summary>
public sealed class LlmTenantBudgetStateReadModel
{
    public long TokensConsumed
    {
        get;
        init;
    }

    public long ReservedTokens
    {
        get;
        init;
    }

    public decimal CommittedUsd
    {
        get;
        init;
    }

    public decimal ReservedUsd
    {
        get;
        init;
    }

    public bool WarnedApproaching
    {
        get;
        init;
    }

    public byte[] RowVersion
    {
        get;
        init;
    } = [];

    public long TotalTokenPressure => TokensConsumed + ReservedTokens;

    public decimal TotalUsdPressure => CommittedUsd + ReservedUsd;
}
