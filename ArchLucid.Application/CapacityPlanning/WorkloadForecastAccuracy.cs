namespace ArchLucid.Application.CapacityPlanning;

/// <summary>Pointwise error comparison; not evidence of a population confidence interval.</summary>
public static class WorkloadForecastAccuracy
{
    public sealed record Error(decimal AbsoluteError, decimal? AbsolutePercentageError,
        bool ThresholdExceeded);
    public static Error Compare(decimal forecast, decimal observed, decimal? AdvisoryPercentThreshold = null)
    {
        if (forecast < 0 || observed < 0 ||
            (AdvisoryPercentThreshold is not null && AdvisoryPercentThreshold < 0))
            throw new ArgumentOutOfRangeException(nameof(forecast));
        decimal error = Math.Abs(checked(forecast - observed));
        decimal? percentage = observed == 0 ? null : checked(100m * error / observed);
        return new(error, percentage, percentage is not null && AdvisoryPercentThreshold is not null &&
            percentage > AdvisoryPercentThreshold);
    }
}
