using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceHopFocusRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void InventoryDiagramExcellence_neighborhood_includes_vnet_without_nic_card()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceHopFocusGraphFixture.BuildVmNicSubnetVnetGraph();
        graph.Nodes.Add(InventoryDiagramExcellenceHopFocusGraphFixture.CreateUnrelatedVmNode());

        DiagramAst neighborhood = compiler.Compile(
            graph,
            DiagramMode.DependencyNeighborhood,
            new DiagramAstCompileOptions { NeighborhoodSeedNodeId = "vm" });
        DiagramAst full = compiler.Compile(graph, DiagramMode.FullSubscription);

        neighborhood.Nodes.Should().Contain(node => node.Label == "app-vm");
        neighborhood.Nodes.Should().Contain(node => node.Label == "core-vnet");
        neighborhood.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase));
        full.Nodes.Count.Should().BeGreaterThan(neighborhood.Nodes.Count);
    }

    [Fact]
    public void InventoryDiagramExcellence_selected_resources_pulls_cited_vnet_without_full_subscription()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceHopFocusGraphFixture.BuildVmNicSubnetVnetGraph();
        graph.Nodes.Add(InventoryDiagramExcellenceHopFocusGraphFixture.CreateUnrelatedVmNode());

        DiagramAst selected = compiler.Compile(
            graph,
            DiagramMode.SelectedResources,
            new DiagramAstCompileOptions { SelectedNodeIds = ["vm"] });

        selected.Nodes.Should().Contain(node => node.Label == "app-vm");
        selected.Nodes.Should().Contain(node => node.Label == "core-vnet");
        selected.Nodes.Should().NotContain(node => node.Label == "other-vm");
    }

    [Fact]
    public void InventoryDiagramExcellence_resource_group_includes_cited_foreign_vnet_not_sibling_vms()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceHopFocusGraphFixture.BuildVmNicSubnetVnetGraph();
        graph.Nodes.Add(InventoryDiagramExcellenceHopFocusGraphFixture.CreateUnrelatedVmNode());

        DiagramAst resourceGroup = compiler.Compile(
            graph,
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions { ResourceGroupName = "rg-app" });

        resourceGroup.Nodes.Should().Contain(node => node.Label == "app-vm");
        resourceGroup.Nodes.Should().Contain(node => node.Label == "core-vnet");
        resourceGroup.Nodes.Should().NotContain(node => node.Label == "other-vm");
    }
}
