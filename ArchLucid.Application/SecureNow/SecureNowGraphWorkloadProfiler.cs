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
        string EvidenceStatus,
        long ManagedAllocatedBytes = 0,
        long MaximumSampledManagedHeapBytes = 0,
        int WorkingSetSamples = 0,
        long MaximumSampledWorkingSetBytes = 0);

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
        long allocatedBefore = GC.GetTotalAllocatedBytes(false);
        long sampledHeapMax = GC.GetTotalMemory(false);
        long sampledRssMax = memoryBefore;
        int sampleCount = 1;
        using CancellationTokenSource samplerStop = new();
        Task sampler = Task.Run(async () =>
        {
            while (!samplerStop.IsCancellationRequested)
            {
                try { await Task.Delay(10, samplerStop.Token).ConfigureAwait(false); }
                catch (OperationCanceledException) when (samplerStop.IsCancellationRequested) { break; }
                long heap = GC.GetTotalMemory(false);
                process.Refresh();
                long rss = process.WorkingSet64;
                InterlockedMax(ref sampledHeapMax, heap);
                InterlockedMax(ref sampledRssMax, rss);
                Interlocked.Increment(ref sampleCount);
            }
        });
        long start = Stopwatch.GetTimestamp();
        SecureNowTopologyCardinalityForecast.Result topology;
        try { topology = await operation(cancellationToken).ConfigureAwait(false); }
        finally
        {
            await samplerStop.CancelAsync().ConfigureAwait(false);
            await sampler.ConfigureAwait(false);
        }
        double elapsedMs = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
        process.Refresh();
        long memoryAfter = process.WorkingSet64;
        long allocatedAfter = GC.GetTotalAllocatedBytes(false);
        sampledHeapMax = Math.Max(sampledHeapMax, GC.GetTotalMemory(false));
        sampledRssMax = Math.Max(sampledRssMax, memoryAfter);
        double cpuDeltaMs = Math.Max(0, (process.TotalProcessorTime - cpuBefore).TotalMilliseconds);
        return new Profile(workloadRevision, topology.PrefixCount, topology.TraversedEdges,
            topology.VisitedNodes, topology.Truncated, elapsedMs, cpuDeltaMs,
            memoryBefore, memoryAfter, Math.Max(memoryBefore, memoryAfter),
            "SAMPLED_PROCESS_MEMORY_NOT_TRUE_PEAK_OR_OPERATION_ISOLATED",
            Math.Max(0, allocatedAfter - allocatedBefore), sampledHeapMax,
            sampleCount + 1, sampledRssMax);
    }
    private static void InterlockedMax(ref long location, long value)
    {
        long old;
        while ((old = Interlocked.Read(ref location)) < value &&
               Interlocked.CompareExchange(ref location, value, old) != old) { }
    }
}
