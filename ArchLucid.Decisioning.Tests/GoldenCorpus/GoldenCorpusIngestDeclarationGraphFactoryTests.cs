using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

[Trait("Category", "Unit")]
public sealed class GoldenCorpusIngestDeclarationGraphFactoryTests
{
    [Fact]
    public async Task CreateCase58CloudFormationContradictionGraphAsync_parses_publicNetworkAccess_property()
    {
        GraphSnapshot graph = await GoldenCorpusIngestDeclarationGraphFactory
            .CreateCase58CloudFormationContradictionGraphAsync();

        graph.Nodes.Should().ContainSingle();
        graph.Nodes[0].Properties.Should().ContainKey("publicNetworkAccess");
        graph.Nodes[0].Properties["publicNetworkAccess"].Should().Be("disabled");
        graph.Nodes[0].Properties["arn"].Should().Be(GoldenCorpusIngestDeclarationGraphFactory.Case58BucketArn);
    }

    [Fact]
    public async Task CreateCase59PulumiIdentityBlastRadiusGraphAsync_emits_identity_blast_radius_finding()
    {
        GraphSnapshot graph = await GoldenCorpusIngestDeclarationGraphFactory
            .CreateCase59PulumiIdentityBlastRadiusGraphAsync();

        IdentityBlastRadiusFindingEngine engine = new();

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("identity-blast-radius");
    }

    [Fact]
    public async Task CreateCase60CdkDataFlowTrustBoundaryGraphAsync_emits_data_flow_trust_boundary_finding()
    {
        GraphSnapshot graph = await GoldenCorpusIngestDeclarationGraphFactory
            .CreateCase60CdkDataFlowTrustBoundaryGraphAsync();

        DataFlowTrustBoundaryFindingEngine engine = new();

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("data-flow-trust-boundary");
    }

    [Fact]
    public async Task CreateCase65TerraformIdentityPathGraphAsync_emits_identity_blast_radius_finding()
    {
        GraphSnapshot graph = await GoldenCorpusIngestDeclarationGraphFactory
            .CreateCase65TerraformIdentityPathGraphAsync();

        IdentityBlastRadiusFindingEngine engine = new();

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        findings.Should().OnlyContain(finding => finding.EngineType == "identity-blast-radius");
    }
}
