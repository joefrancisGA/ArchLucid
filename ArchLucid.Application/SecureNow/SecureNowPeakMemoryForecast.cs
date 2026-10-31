namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Conservative advisory memory envelope from independently measured same-topology cohorts.
/// A sampled process working set is an observed floor, not a verified peak or safety upper bound.
/// </summary>
public static class SecureNowPeakMemoryForecast
{
    public sealed record Sample(string Cohort, long PrefixCount, int NodeCount, long EdgeCount,
        int HopDepth, long SampledWorkingSetBytes, bool Truncated, string MeasurementScope);
    public sealed record Result(bool Available, long? ObservedFloorBytes, long? AdvisoryBudgetBytes,
        string EvidenceStatus);

    public static Result Estimate(IReadOnlyList<Sample> samples, string cohort, long prefixes,
        int nodeCount, long edgeCount, int depth, decimal HeadroomMultiplier = 1.5m)
    {
        ArgumentNullException.ThrowIfNull(samples);
        ArgumentException.ThrowIfNullOrWhiteSpace(cohort);
        if (samples.Count > 1000 || prefixes < 0 || nodeCount < 0 || edgeCount < 0 ||
            depth is < 0 or > 64 || HeadroomMultiplier < 1 || HeadroomMultiplier > 4)
            throw new ArgumentOutOfRangeException(nameof(samples));
        var valid = samples.Where(s => s.Cohort == cohort && !s.Truncated &&
            s.MeasurementScope == "DEDICATED_PROCESS_SAMPLED" &&
            s.PrefixCount >= 0 && s.NodeCount >= 0 && s.EdgeCount >= 0 &&
            s.HopDepth is >= 0 and <= 64 && s.SampledWorkingSetBytes >= 0).ToArray();
        if (valid.Length < 2 || !valid.Any(s => s.NodeCount <= nodeCount && s.EdgeCount <= edgeCount
            && s.PrefixCount <= prefixes && s.HopDepth <= depth) ||
            !valid.Any(s => s.NodeCount >= nodeCount && s.EdgeCount >= edgeCount &&
            s.PrefixCount >= prefixes && s.HopDepth >= depth))
            return new(false, null, null, "OUTSIDE_MEASURED_COHORT_ENVELOPE");
        long floor = valid.Max(s => s.SampledWorkingSetBytes);
        decimal budget = Math.Ceiling(floor * HeadroomMultiplier);
        if (budget > long.MaxValue)
            return new(false, floor, null, "BUDGET_OVERFLOW");
        return new(true, floor, (long)budget, "SAMPLED_FLOOR_WITH_ASSUMED_HEADROOM_NOT_VERIFIED_PEAK");
    }
}
