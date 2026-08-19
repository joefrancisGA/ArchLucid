namespace ArchLucid.Persistence.Models;

/// <summary>Single global row in <c>dbo.HostLlmCostEstimationUsdRates</c>.</summary>
public sealed class LlmCostEstimationUsdRateOverrideRow
{
    public decimal InputUsdPerMillionTokens
    {
        get;
        init;
    }

    public decimal OutputUsdPerMillionTokens
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }

    public string UpdatedBy
    {
        get;
        init;
    } = null!;
}
