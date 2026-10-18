using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellencePrivateEndpointOptInRatchetTests
{
    private const string PrivateEndpointArmType = "Microsoft.Network/privateEndpoints";

    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly MermaidDiagramRenderPipeline mermaidPipeline = new(
        new MermaidDiagramRenderer(),
        new MermaidDiagramComplexityAnalyzer(),
        new MermaidDiagramDeterministicRepairer(),
        new MermaidDiagramStructuralValidator(),
        new MermaidDiagramSemanticIntegrityGuard(),
        new MermaidDiagramFallbackSetBuilder(
            new DiagramAstFromGraphCompiler(),
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator(),
            new DiagramPeelCatalogDefaultProvider()));

    [Theory]
    [InlineData(DiagramMode.DataFlow)]
    [InlineData(DiagramMode.DataArchitecture)]
    public void InventoryDiagramExcellence_data_canvases_hide_private_endpoints_by_default(DiagramMode mode)
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, mode, includePrivateEndpointNodes: false);

        ast.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Equals(PrivateEndpointArmType, StringComparison.OrdinalIgnoreCase),
            because: $"{mode} must default PE cards off");
    }

    [Fact]
    public async Task InventoryDiagramExcellence_mermaid_export_hides_private_endpoints_when_opt_in_false()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, DiagramMode.FullSubscription, includePrivateEndpointNodes: false);

        MermaidDiagramRenderResult mermaid = await mermaidPipeline.RenderAsync(new MermaidDiagramRenderRequest { Ast = ast });

        mermaid.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        mermaid.PrimaryMermaid.Should().NotContain("privateEndpoints", "PE cards stay off when IncludePrivateEndpointNodes is false");
    }

    [Fact]
    public void InventoryDiagramExcellence_network_opt_in_surfaces_private_endpoint_card()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, DiagramMode.Network, includePrivateEndpointNodes: true);

        ast.Nodes.Should().Contain(node =>
            (node.ArmResourceType ?? string.Empty).Equals(PrivateEndpointArmType, StringComparison.OrdinalIgnoreCase));
    }

    private DiagramAst Compile(GraphSnapshot graph, DiagramMode mode, bool includePrivateEndpointNodes)
    {
        DiagramAstCompileOptions options = new()
        {
            IncludePrivateEndpointNodes = includePrivateEndpointNodes,
            ResourceGroupName = mode == DiagramMode.ResourceGroup ? "network-rg" : null,
            NeighborhoodSeedNodeId = mode == DiagramMode.DependencyNeighborhood ? "vm-1" : null,
            SelectedNodeIds = mode == DiagramMode.SelectedResources ? ["vm-1"] : null,
        };

        return compiler.Compile(graph, mode, options);
    }
}
