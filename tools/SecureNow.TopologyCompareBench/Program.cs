using System.Runtime.InteropServices;
using System.Text.Json;
using ArchLucid.Application.SecureNow;
using SecureNow.TopologyCompareBench;

if (args.Length != 6 ||
    args[0] is not ("copying-baseline" or "optimized-dfs") ||
    args[1] is not ("chain" or "cyclic" or "branching" or "dense") ||
    !int.TryParse(args[2], out int nodes) || nodes is < 20 or > 2000 ||
    !int.TryParse(args[3], out int depth) || depth is < 1 or > 16 ||
    !int.TryParse(args[4], out int repetition) || repetition is < 1 or > 20 ||
    string.IsNullOrWhiteSpace(args[5]))
{
    Console.Error.WriteLine("Usage: <copying-baseline|optimized-dfs> <chain|cyclic|branching|dense> <nodes 20..2000> <depth 1..16> <repetition 1..20> <output.json>");
    return 2;
}

string engine = args[0], cohort = args[1];
var graph = new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal);
for (int i = 0; i < nodes; i++)
{
    IEnumerable<int> neighbors = cohort switch
    {
        "chain" => i + 1 < nodes ? [i + 1] : [],
        "cyclic" => [(i + 1) % nodes],
        "branching" => Enumerable.Range(1, 4).Where(k => i + k < nodes).Select(k => i + k),
        _ => i < 40 ? Enumerable.Range(0, Math.Min(nodes, 40)).Where(j => j != i) : []
    };
    graph[i.ToString()] = neighbors.Select(n => n.ToString()).ToArray();
}
long edgeCount = graph.Values.Sum(v => (long)v.Count);
const long maxPrefixes = 20000;
int gen0 = GC.CollectionCount(0), gen1 = GC.CollectionCount(1), gen2 = GC.CollectionCount(2);
// Only run one engine in this process. Graph construction is outside measurement.
var profile = await SecureNowGraphWorkloadProfiler.MeasureAsync(
    $"topology-compare-{engine}-v1",
    ct =>
    {
        ct.ThrowIfCancellationRequested();
        var topology = engine == "copying-baseline"
            ? CopyingTopologyBaseline.Count(graph, ["0"], depth, maxPrefixes)
            : SecureNowTopologyCardinalityForecast.Count(graph, ["0"], depth, maxPrefixes);
        return Task.FromResult(topology);
    });
var result = new
{
    schemaVersion = 1,
    benchmarkKind = "SECURENOW_TOPOLOGY_ALGORITHM_COMPARISON",
    engine,
    cohort,
    nodes,
    edgeCount,
    depth,
    maxPrefixes,
    repetition,
    profile,
    gcGen0Collections = GC.CollectionCount(0) - gen0,
    gcGen1Collections = GC.CollectionCount(1) - gen1,
    gcGen2Collections = GC.CollectionCount(2) - gen2,
    framework = RuntimeInformation.FrameworkDescription,
    processorCount = Environment.ProcessorCount,
    measurementStatus = "PROCESS_WIDE_WITH_SAMPLED_RSS_NOT_TRUE_PEAK",
    limitations = "Synthetic graph traversal only, not security-path evidence evaluation. Managed allocation is process-wide, RSS sampled, GC counts are process-wide. Startup overhead and GC nondeterminism affect comparisons."
};
string target = Path.GetFullPath(args[5]);
Directory.CreateDirectory(Path.GetDirectoryName(target)!);
await File.WriteAllTextAsync(target, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
return 0;
