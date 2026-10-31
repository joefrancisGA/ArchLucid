namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Explicit calibration between structural graph work and observed resource usage.
/// Never extrapolates beyond a benchmark envelope or turns truncated counts into forecasts.
/// </summary>
public static class SecureNowGraphResourceDemandForecast
{
    public sealed record Calibration(
        string BenchmarkRevision,
        long MeasuredPrefixCount,
        decimal MeasuredCpuSeconds,
        decimal MeasuredPeakGiB,
        decimal MeasuredWorkerSeconds,
        long MaximumValidatedPrefixCount);

    public sealed record Result(
        bool ForecastAvailable,
        decimal? CpuSeconds,
        decimal? PeakGiB,
        decimal? WorkerSeconds,
        string EvidenceStatus);

    public static Result Estimate(
        SecureNowTopologyCardinalityForecast.Result topology,
        Calibration? calibration)
    {
        ArgumentNullException.ThrowIfNull(topology);
        if (calibration is null)
            return new(false, null, null, null, "MISSING_CALIBRATION");
        if (string.IsNullOrWhiteSpace(calibration.BenchmarkRevision) ||
            calibration.MeasuredPrefixCount <= 0 ||
            calibration.MaximumValidatedPrefixCount < calibration.MeasuredPrefixCount ||
            calibration.MeasuredCpuSeconds < 0 ||
            calibration.MeasuredPeakGiB < 0 ||
            calibration.MeasuredWorkerSeconds < 0)
            throw new ArgumentException("Calibration must have measured nonnegative usage and a valid envelope.", nameof(calibration));

        if (topology.Truncated || topology.PrefixCount < 0 ||
            topology.PrefixCount > calibration.MaximumValidatedPrefixCount)
            return new(false, null, null, null, "OUTSIDE_BENCHMARK_ENVELOPE");

        // Linear CPU/worker-time interpolation is a scenario assumption. Peak memory
        // is kept at the observed calibrated value rather than falsely extrapolated.
        decimal ratio = (decimal)topology.PrefixCount / calibration.MeasuredPrefixCount;
        return new(true,
            checked(calibration.MeasuredCpuSeconds * ratio),
            calibration.MeasuredPeakGiB,
            checked(calibration.MeasuredWorkerSeconds * ratio),
            "CALIBRATED_INPUT_LINEAR_SCENARIO");
    }
}
