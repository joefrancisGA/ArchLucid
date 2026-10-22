namespace ArchLucid.Contracts.Operations;

public sealed class TrialFunnelFirstReviewCostResponse
{
    public decimal? MedianEstimatedUsd
    {
        get;
        init;
    }

    public decimal? LowEstimatedUsd
    {
        get;
        init;
    }

    public decimal? HighEstimatedUsd
    {
        get;
        init;
    }

    public int SampleSize
    {
        get;
        init;
    }

    public string CurrencyCode
    {
        get;
        init;
    } = "USD";

    public string BasisLabel
    {
        get;
        init;
    } = "estimated";

    /// <summary>unavailable | insufficient-sample | rates-missing | estimated</summary>
    public string Status
    {
        get;
        init;
    } = "unavailable";

    public string? StatusDetail
    {
        get;
        init;
    }
}
