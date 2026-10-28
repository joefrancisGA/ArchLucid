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
}
