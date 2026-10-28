using System.Text.Json;
using ArchLucid.Application.SecureNow;
using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Slow")]
[Trait("Suite", "Application")]
public sealed class SecureNowGraphCapacityProfileBenchmarkTests
{
    [Theory]
    [InlineData(1000)]
    [InlineData(5000)]
    public async Task Profile_deterministic_sparse_directed_graph(int nodes)
    {
        // Fixed topology: a directed chain. No random data or tenant evidence.
        Dictionary<string, IReadOnlyList<string>> graph = new(StringComparer.Ordinal);
        for (int i = 0; i < nodes; i++)
            graph[i.ToString()] = i + 1 < nodes ? [(i + 1).ToString()] : [];

        SecureNowGraphWorkloadProfiler.Profile profile = await
            SecureNowGraphWorkloadProfiler.MeasureAsync(
                "securenow-graph-chain-v1",
                ct => Task.FromResult(SecureNowTopologyCardinalityForecast.Count(
                    graph, ["0"], nodes - 1, 10000)), CancellationToken.None);

        profile.PrefixCount.Should().Be(nodes);
        profile.Truncated.Should().BeFalse();

        string? outputDir = Environment.GetEnvironmentVariable("SECURENOW_GRAPH_PROFILE_OUTPUT_DIR");
        if (string.IsNullOrWhiteSpace(outputDir))
            return;

        Directory.CreateDirectory(outputDir);
        string path = Path.Combine(outputDir, $"graph-chain-{nodes}.json");
        var artifact = new
        {
            schemaVersion = 1,
            fixture = "directed-chain",
            nodeCount = nodes,
            edgeCount = nodes - 1,
            maxHopDepth = nodes - 1,
            profile,
            measurementLimitations = "Process-wide CPU; memory observed only before/after; synthetic workload, not production calibration."
        };
        await File.WriteAllTextAsync(path, JsonSerializer.Serialize(artifact,
            new JsonSerializerOptions { WriteIndented = true }), CancellationToken.None);
    }
    [Theory]
    [InlineData("sparse", 1000, 3, 10000)]
    [InlineData("dense", 40, 4, 10000)]
    [InlineData("cyclic", 1000, 8, 10000)]
    [InlineData("high-branching", 1000, 6, 10000)]
    public async Task Profile_deterministic_topology_cohorts(
        string topology, int nodes, int depth, long budget)
    {
        Dictionary<string, IReadOnlyList<string>> graph = new(StringComparer.Ordinal);
        for (int i = 0; i < nodes; i++)
        {
            IEnumerable<int> targets = topology switch
            {
                "sparse" => i + 1 < nodes ? [i + 1] : [],
                "dense" => Enumerable.Range(0, nodes).Where(j => j != i),
                "cyclic" => [(i + 1) % nodes],
                "high-branching" => Enumerable.Range(1, 8)
                    .Where(k => i + k < nodes).Select(k => i + k),
                _ => throw new ArgumentOutOfRangeException(nameof(topology)),
            };
            graph[i.ToString()] = targets.Select(j => j.ToString()).ToArray();
        }

        var profile = await SecureNowGraphWorkloadProfiler.MeasureAsync(
            $"securenow-{topology}-v1",
            _ => Task.FromResult(SecureNowTopologyCardinalityForecast.Count(
                graph, ["0"], depth, budget)), CancellationToken.None);
        profile.PrefixCount.Should().BeGreaterThan(0);
        profile.PrefixCount.Should().BeLessThanOrEqualTo(budget);
        profile.TraversedEdges.Should().BeGreaterThan(0);

        string? outputDir = Environment.GetEnvironmentVariable("SECURENOW_GRAPH_PROFILE_OUTPUT_DIR");
        if (string.IsNullOrWhiteSpace(outputDir)) return;
        Directory.CreateDirectory(outputDir);
        var artifact = new
        {
            schemaVersion = 1,
            fixture = topology,
            nodeCount = nodes,
            edgeCount = graph.Values.Sum(v => v.Count),
            maxHopDepth = depth,
            prefixBudget = budget,
            profile,
            measurementLimitations = "Synthetic topology; process-level CPU, two memory samples, not per-operation peak or production calibration."
        };
        await File.WriteAllTextAsync(
            Path.Combine(outputDir, $"graph-{topology}-{nodes}.json"),
            JsonSerializer.Serialize(artifact, new JsonSerializerOptions { WriteIndented = true }),
            CancellationToken.None);
    }

}
