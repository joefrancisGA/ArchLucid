namespace ArchLucid.Contracts.Operations;

public sealed class TrialFunnelTimingMetricsResponse
{
    public double? MedianTrialStartToFirstReviewFinalizedHours
    {
        get;
        init;
    }

    public int? MedianTrialStartToFirstReviewFinalizedSampleSize
    {
        get;
        init;
    }

    public double? MedianTrialStartToConversionHours
    {
        get;
        init;
    }

    public int? MedianTrialStartToConversionSampleSize
    {
        get;
        init;
    }
}
