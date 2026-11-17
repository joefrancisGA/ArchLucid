using System.Text.Json;
using ArchLucid.Application.SecureNow;

if (args.Length != 4 || !new[] { "chain", "cyclic", "branching", "dense" }.Contains(args[0]) ||
    !int.TryParse(args[1], out int nodes) || nodes is < 20 or > 2000 ||
    !int.TryParse(args[2], out int depth) || depth is < 1 or > 8 ||
    string.IsNullOrWhiteSpace(args[3]))
{
    Console.Error.WriteLine("Usage: <chain|cyclic|branching|dense> <nodes 20..2000> <depth 1..8> <output>");
    return 2;
}
string cohort = args[0];
var graph = new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal);
for (int i = 0; i < nodes; i++)
{
    IEnumerable<int> neighbors = cohort switch
    {
        "chain" => i + 1 < nodes ? [i + 1] : [],
        "cyclic" => [(i + 1) % nodes],
        "branching" => Enumerable.Range(1, 4).Where(k => i + k < nodes).Select(k => i + k),
        _ => Enumerable.Range(0, Math.Min(nodes, 40)).Where(j => j != i && i < 40)
    };
    graph[i.ToString()] = neighbors.Select(n => n.ToString()).ToArray();
}
long edges = graph.Values.Sum(x => (long)x.Count);
var profile = await SecureNowGraphWorkloadProfiler.MeasureAsync(
    $"memory-{cohort}-v1",
    ct => Task.FromResult(SecureNowTopologyCardinalityForecast.Count(
        graph, ["0"], depth, 20000)));
var sample = new SecureNowPeakMemoryForecast.Sample(cohort, profile.PrefixCount, nodes,
    edges, depth, profile.MaximumSampledWorkingSetBytes, profile.Truncated, "DEDICATED_PROCESS_SAMPLED");
var result = new
{
    schemaVersion = 1,
    benchmarkKind = "DEDICATED_PROCESS_SYNTHETIC_GRAPH",
    runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
    processorCount = Environment.ProcessorCount,
    sample,
    profile,
    evidenceStatus = "SAMPLED_MEMORY_NOT_TRUE_PEAK",
    limitations = "Dedicated invocation of synthetic topology counter; process RSS samples can miss peaks and do not isolate operation allocation."
};
string output = Path.GetFullPath(args[3]);
Directory.CreateDirectory(Path.GetDirectoryName(output)!);
await File.WriteAllTextAsync(output, JsonSerializer.Serialize(result,
    new JsonSerializerOptions { WriteIndented = true }));
return 0;
