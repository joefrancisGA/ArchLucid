using System.Diagnostics;
using System.Text.Json;

namespace ArchLucid.Application.CapacityPlanning;

/// <summary>
/// A process-local measurement harness. Valid calibration requires the caller to run
/// one benchmark workload in a dedicated process with no competing work.
/// </summary>
public static class IsolatedWorkloadBenchmark
{
    public sealed record Measurements(WorkloadCalibration.Observation Observation,
        long WorkingSetStartBytes, long WorkingSetEndBytes, long MaximumSampledWorkingSetBytes,
        int Samples, string MemoryEvidenceStatus);

    public static async Task<Measurements> MeasureAsync(
        string revision, string workload, decimal workUnits,
        Func<CancellationToken, Task> operation, TimeSpan sampleInterval,
        bool dedicatedProcessConfirmed, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(revision);
        ArgumentException.ThrowIfNullOrWhiteSpace(workload);
        ArgumentNullException.ThrowIfNull(operation);
        if (workUnits <= 0 || sampleInterval < TimeSpan.FromMilliseconds(10) ||
            sampleInterval > TimeSpan.FromSeconds(5))
            throw new ArgumentOutOfRangeException(nameof(workUnits));
        cancellationToken.ThrowIfCancellationRequested();
        using Process process = Process.GetCurrentProcess();
        process.Refresh();
        TimeSpan beforeCpu = process.TotalProcessorTime;
        long startMemory = process.WorkingSet64;
        long maxMemory = startMemory;
        int sampleCount = 1;
        using CancellationTokenSource samplingStop = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        Task sampler = Task.Run(async () =>
        {
            while (!samplingStop.IsCancellationRequested)
            {
                try { await Task.Delay(sampleInterval, samplingStop.Token).ConfigureAwait(false); }
                catch (OperationCanceledException) when (samplingStop.IsCancellationRequested) { break; }
                process.Refresh();
                long current = process.WorkingSet64;
                InterlockedExtensions.Max(ref maxMemory, current);
                Interlocked.Increment(ref sampleCount);
            }
        }, CancellationToken.None);
        Stopwatch elapsed = Stopwatch.StartNew();
        try { await operation(cancellationToken).ConfigureAwait(false); }
        finally
        {
            elapsed.Stop();
            await samplingStop.CancelAsync().ConfigureAwait(false);
            await sampler.ConfigureAwait(false);
        }
        process.Refresh();
        long endMemory = process.WorkingSet64;
        maxMemory = Math.Max(maxMemory, endMemory);
        decimal cpu = (decimal)Math.Max(0, (process.TotalProcessorTime - beforeCpu).TotalSeconds);
        var observation = new WorkloadCalibration.Observation(1, revision, workload, workUnits,
            cpu, (decimal)elapsed.Elapsed.TotalSeconds,
            maxMemory / (1024m * 1024m * 1024m), false,
            dedicatedProcessConfirmed ? "ISOLATED_OPERATION" : "PROCESS_WIDE");
        return new(observation, startMemory, endMemory, maxMemory, sampleCount + 1,
            "SAMPLED_WORKING_SET_NOT_TRUE_PEAK");
    }

    private static class InterlockedExtensions
    {
        public static void Max(ref long target, long value)
        {
            long current;
            while ((current = Interlocked.Read(ref target)) < value &&
                   Interlocked.CompareExchange(ref target, value, current) != current) { }
        }
    }

    public static string ToCalibrationJson(Measurements measurements)
    {
        ArgumentNullException.ThrowIfNull(measurements);
        return JsonSerializer.Serialize(measurements.Observation);
    }
}
