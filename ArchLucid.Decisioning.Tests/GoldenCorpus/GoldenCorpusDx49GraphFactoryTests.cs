using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

[Trait("Suite", "Decisioning")]
public sealed class GoldenCorpusDx49GraphFactoryTests
{
    [Fact]
    public async Task Case61_graph_emits_topology_anti_pattern()
    {
        GraphSnapshot graph = GoldenCorpusDx49GraphFactory.CreateTopologyAntiPatternGraph();
        TopologyAntiPatternFindingEngine engine = new();

        IReadOnlyList<ArchLucid.Contracts.Findings.Finding> findings =
            await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().Contain(f =>
            f.EngineType == "topology-anti-pattern"
            && f.Title.Contains("no compute dependency", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Case62_graph_emits_security_baseline_expectation()
    {
        GraphSnapshot graph = GoldenCorpusDx49GraphFactory.CreateSecurityBaselineExpectationGraph();
        SecurityBaselineExpectationFindingEngine engine = new(new GraphCoverageAnalyzer());

        IReadOnlyList<ArchLucid.Contracts.Findings.Finding> findings =
            await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle(f => f.EngineType == "security-baseline-expectation");
    }

    [Fact]
    public async Task Case63_graph_emits_required_capability_coverage()
    {
        GraphSnapshot graph = GoldenCorpusDx49GraphFactory.CreateRequiredCapabilityCoverageGraph();
        RequiredCapabilityCoverageFindingEngine engine = new(new RequiredCapabilityCoverageAnalyzer());

        IReadOnlyList<ArchLucid.Contracts.Findings.Finding> findings =
            await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle(f => f.EngineType == "required-capability-coverage");
    }
}
