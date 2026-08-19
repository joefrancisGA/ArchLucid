using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;

using ArchLucidFindingEngine;

namespace ArchLucidFindingEngine.Tests;
[Trait("Category", "Unit")]

public sealed class PluginSampleFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_returns_one_informational_finding()
    {
        PluginSampleFindingEngine sut = new();
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        Assert.Single(findings);
        Assert.Equal("plugin-sample", sut.EngineType);
        Assert.Equal(FindingSeverity.Info, findings[0].Severity);
    }
}
