using System.Diagnostics;

namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Collects process-level resource observations around a single awaited graph workload.
/// CPU and working set reflect the entire process, not exclusively this operation.
/// </summary>
public static class SecureNowGraphWorkloadProfiler
{
    public sealed record Profile(
        string WorkloadRevision,
        long PrefixCount,
        long TraversedEdges,
        int VisitedNodes,
        bool Truncated,
        double ElapsedMilliseconds,
        double ProcessCpuMillisecondsDelta,
        long WorkingSetBeforeBytes,
        long WorkingSetAfterBytes,
        long WorkingSetObservedMaxBytes,
        string EvidenceStatus);

    public static async Task<Profile> MeasureAsync(
        string workloadRevision,
        Func<CancellationToken, Task<SecureNowTopologyCardinalityForecast.Result>> operation,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(workloadRevision);
        ArgumentNullException.ThrowIfNull(operation);
        cancellationToken.ThrowIfCancellationRequested();

        using Process process = Process.GetCurrentProcess();
        process.Refresh();
        TimeSpan cpuBefore = process.TotalProcessorTime;
        long memoryBefore = process.WorkingSet64;
        long start = Stopwatch.GetTimestamp();
        SecureNowTopologyCardinalityForecast.Result topology =
            await operation(cancellationToken);
        double elapsedMs = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
        process.Refresh();
        long memoryAfter = process.WorkingSet64;
        double cpuDeltaMs = Math.Max(0, (process.TotalProcessorTime - cpuBefore).TotalMilliseconds);
        return new Profile(workloadRevision, topology.PrefixCount, topology.TraversedEdges,
            topology.VisitedNodes, topology.Truncated, elapsedMs, cpuDeltaMs,
            memoryBefore, memoryAfter, Math.Max(memoryBefore, memoryAfter),
            "OBSERVED_PROCESS_DELTA_NOT_OPERATION_ISOLATED");
    }
}
