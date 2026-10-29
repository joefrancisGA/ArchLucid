using System.Collections.Concurrent;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Moq;
using SecureNow.AnalysisRunCacheBench;

if (args.Length != 5 ||
    args[0] is not ("serialized-baseline" or "bounded-singleflight") ||
    args[1] is not ("fanout" or "retention-pressure") ||
    !int.TryParse(args[2], out int rowsPerSnapshot) || rowsPerSnapshot is < 100 or > 5000 ||
    !int.TryParse(args[3], out int repetition) || repetition is < 1 or > 20 ||
    string.IsNullOrWhiteSpace(args[4]))
{
    Console.Error.WriteLine("Usage: <serialized-baseline|bounded-singleflight> <fanout|retention-pressure> <rows 100..5000> <repetition 1..20> <output.json>");
    return 2;
}

string engine = args[0], scenario = args[1];
const int SimulatedReadLatencyMs = 25;
const int FixedRequestsPerScenario = 24;
int distinctSnapshots = scenario == "fanout" ? 6 : 12;
Guid[] snapshotIds = Enumerable.Range(1, distinctSnapshots)
    .Select(i => Guid.Parse($"00000000-0000-0000-0000-{i:D12}")).ToArray();
ScopeContext scope = new()
{
    TenantId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
    WorkspaceId = Guid.Parse("20000000-0000-0000-0000-000000000002"),
    ProjectId = Guid.Parse("30000000-0000-0000-0000-000000000003"),
};

int repositoryReadCalls = 0;
int activeRepositoryCalls = 0;
int maxConcurrentRepositoryCalls = 0;
Mock<IAzureInventorySnapshotRepository> mock = new();
mock.Setup(r => r.TryGetSnapshotDetailAsync(
        It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
    .Returns(async (ScopeContext readScope, Guid id, CancellationToken token) =>
    {
        Interlocked.Increment(ref repositoryReadCalls);
        int active = Interlocked.Increment(ref activeRepositoryCalls);
        int prior;
        while ((prior = Volatile.Read(ref maxConcurrentRepositoryCalls)) < active &&
            Interlocked.CompareExchange(ref maxConcurrentRepositoryCalls, active, prior) != prior) { }
        try
        {
            // Deterministic latency is an in-memory repository simulation, NOT SQL.
            await Task.Delay(SimulatedReadLatencyMs, token).ConfigureAwait(false);
            var resources = Enumerable.Range(0, rowsPerSnapshot)
                .Select(i => new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    CloudResourceId = id,
                    AzureResourceId = $"/subscriptions/benchmark/resourceGroups/rg/providers/Example/resources/{id:N}/{i}",
                    ResourceType = "Microsoft.Compute/virtualMachines",
                }).ToArray();
            return new AzureInventorySnapshotDetailReadModel
            {
                Header = new()
                {
                    TenantId = readScope.TenantId,
                    WorkspaceId = readScope.WorkspaceId,
                    ProjectId = readScope.ProjectId,
                    SnapshotId = id,
                },
                Resources = resources,
            };
        }
        finally
        {
            Interlocked.Decrement(ref activeRepositoryCalls);
        }
    });

SerializedRunCacheBaseline? baseline = engine == "serialized-baseline"
    ? new SerializedRunCacheBaseline()
    : null;
using IDisposable? currentRun = engine == "bounded-singleflight" ? SecureNowAnalysisRun.Begin() : null;

using Process process = Process.GetCurrentProcess();
process.Refresh();
long rssBefore = process.WorkingSet64;
long maxRssSampled = rssBefore;
long maxManagedHeapSampled = GC.GetTotalMemory(false);
long allocationBefore = GC.GetTotalAllocatedBytes(false);
int gc0Before = GC.CollectionCount(0), gc1Before = GC.CollectionCount(1),
    gc2Before = GC.CollectionCount(2);
int rssSamples = 1;
using CancellationTokenSource stopSampler = new();
Task sampler = Task.Run(async () =>
{
    while (!stopSampler.IsCancellationRequested)
    {
        try { await Task.Delay(10, stopSampler.Token).ConfigureAwait(false); }
        catch (OperationCanceledException) when (stopSampler.IsCancellationRequested) { break; }
        process.Refresh();
        UpdateMax(ref maxRssSampled, process.WorkingSet64);
        UpdateMax(ref maxManagedHeapSampled, GC.GetTotalMemory(false));
        Interlocked.Increment(ref rssSamples);
    }
});

ConcurrentBag<double> latencies = [];
long rowsReturned = 0;
int requests = 0;
async Task LookupAsync(Guid id)
{
    long start = Stopwatch.GetTimestamp();
    SecureNowAnalysisSnapshot? snapshot = baseline is null
        ? await SecureNowAnalysisRun.LoadAsync(mock.Object, scope, id, CancellationToken.None)
        : await baseline.LoadAsync(mock.Object, scope, id, CancellationToken.None);
    if (snapshot is null || snapshot.Snapshot.Header.SnapshotId != id ||
        snapshot.Snapshot.Header.TenantId != scope.TenantId ||
        snapshot.Snapshot.Resources.Count != rowsPerSnapshot)
        throw new InvalidOperationException("Repository result scope/shape mismatch");
    Interlocked.Add(ref rowsReturned, snapshot.Snapshot.Resources.Count);
    Interlocked.Increment(ref requests);
    latencies.Add(Stopwatch.GetElapsedTime(start).TotalMilliseconds);
}

long wallStart = Stopwatch.GetTimestamp();
try
{
    // Two complete waves guarantee that retention-pressure tests a cache hit
    // after the first 12 distinct snapshots have completed, not just coalescing.
    Guid[] waveOne = scenario == "fanout"
        ? snapshotIds.Concat(snapshotIds).ToArray()
        : snapshotIds;
    Guid[] waveTwo = scenario == "fanout"
        ? snapshotIds.Concat(snapshotIds).Reverse().ToArray()
        : snapshotIds.Reverse().ToArray();
    await Task.WhenAll(waveOne.Select(LookupAsync));
    await Task.WhenAll(waveTwo.Select(LookupAsync));
}
finally
{
    await stopSampler.CancelAsync();
    await sampler;
}
double wallMs = Stopwatch.GetElapsedTime(wallStart).TotalMilliseconds;
process.Refresh();
long rssAfter = process.WorkingSet64;
UpdateMax(ref maxRssSampled, rssAfter);
UpdateMax(ref maxManagedHeapSampled, GC.GetTotalMemory(false));
long allocatedBytes = Math.Max(0, GC.GetTotalAllocatedBytes(false) - allocationBefore);
double[] ordered = latencies.Order().ToArray();
if (requests != FixedRequestsPerScenario || ordered.Length != requests ||
    rowsReturned != (long)FixedRequestsPerScenario * rowsPerSnapshot)
    throw new InvalidOperationException("Fixture did not complete its expected request count");

var artifact = new
{
    schemaVersion = 1,
    benchmarkKind = "SECURENOW_ANALYSIS_RUN_CACHE_COMPARISON",
    engine,
    scenario,
    rowsPerSnapshot,
    distinctSnapshots,
    repetition,
    requests,
    repositoryReadCalls,
    reuseAvoidedRepositoryReads = requests - repositoryReadCalls,
    maxConcurrentRepositoryCalls,
    validatedRowsReturned = rowsReturned,
    simulatedRepositoryDelayMs = SimulatedReadLatencyMs,
    p50RequestLatencyMs = Percentile(ordered, 0.50),
    p95RequestLatencyMs = Percentile(ordered, 0.95),
    wallMilliseconds = wallMs,
    managedAllocatedBytes = allocatedBytes,
    workingSetBeforeBytes = rssBefore,
    workingSetAfterBytes = rssAfter,
    maxSampledWorkingSetBytes = maxRssSampled,
    maxSampledManagedHeapBytes = maxManagedHeapSampled,
    sampledWorkingSetObservations = rssSamples + 1,
    gcGen0Collections = GC.CollectionCount(0) - gc0Before,
    gcGen1Collections = GC.CollectionCount(1) - gc1Before,
    gcGen2Collections = GC.CollectionCount(2) - gc2Before,
    runtime = RuntimeInformation.FrameworkDescription,
    processorCount = Environment.ProcessorCount,
    measurementStatus = "SYNTHETIC_REPOSITORY_NOT_SQL_PROCESS_SAMPLED_RSS",
};
string output = Path.GetFullPath(args[4]);
Directory.CreateDirectory(Path.GetDirectoryName(output)!);
await File.WriteAllTextAsync(output, JsonSerializer.Serialize(artifact,
    new JsonSerializerOptions { WriteIndented = true }));

static double Percentile(double[] ordered, double percentile) =>
    ordered[Math.Clamp((int)Math.Ceiling(ordered.Length * percentile) - 1, 0, ordered.Length - 1)];

static void UpdateMax(ref long target, long observation)
{
    long before;
    while ((before = Interlocked.Read(ref target)) < observation &&
        Interlocked.CompareExchange(ref target, observation, before) != before) { }
}
