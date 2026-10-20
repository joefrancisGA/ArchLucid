using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramAstResourceGroupPrivateEndpointCompileTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Resource_group_mode_hides_private_endpoints_until_opt_in()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst hidden = compiler.Compile(
            graph,
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions
            {
                ResourceGroupName = "network-rg",
                IncludePrivateEndpointNodes = false,
            });
        DiagramAst visible = compiler.Compile(
            graph,
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions
            {
                ResourceGroupName = "network-rg",
                IncludePrivateEndpointNodes = true,
            });

        hidden.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Equals(
                "Microsoft.Network/privateEndpoints",
                StringComparison.OrdinalIgnoreCase));
        visible.Nodes.Should().Contain(node =>
            (node.ArmResourceType ?? string.Empty).Equals(
                "Microsoft.Network/privateEndpoints",
                StringComparison.OrdinalIgnoreCase));
    }
}
