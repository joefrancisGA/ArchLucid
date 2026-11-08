namespace ArchLucid.Application.CapacityPlanning;

/// <summary>Fluid queue scenario. No percentile latency prediction or stochastic assumptions.</summary>
public static class WorkloadQueueForecast
{
    public sealed record Window(decimal ArrivalJobsPerSecond, decimal ServiceJobsPerSecond,
        decimal DurationSeconds);
    public sealed record Result(decimal EndingBacklog, decimal PeakBacklog,
        decimal? DrainSecondsAtFinalServiceRate, bool Saturated);

    public static Result Estimate(decimal initialBacklog, IReadOnlyList<Window> windows)
    {
        ArgumentNullException.ThrowIfNull(windows);
        if (initialBacklog < 0) throw new ArgumentOutOfRangeException(nameof(initialBacklog));
        decimal backlog = initialBacklog, peak = backlog, lastService = 0;
        foreach (Window w in windows)
        {
            if (w.ArrivalJobsPerSecond < 0 || w.ServiceJobsPerSecond < 0 || w.DurationSeconds < 0)
                throw new ArgumentOutOfRangeException(nameof(windows));
            backlog = Math.Max(0, checked(backlog + (w.ArrivalJobsPerSecond - w.ServiceJobsPerSecond) * w.DurationSeconds));
            peak = Math.Max(peak, backlog);
            lastService = w.ServiceJobsPerSecond;
        }
        return new Result(backlog, peak, lastService > 0 ? backlog / lastService : null,
            backlog > 0 && (windows.Count == 0 || windows[^1].ArrivalJobsPerSecond >= lastService));
    }
}
