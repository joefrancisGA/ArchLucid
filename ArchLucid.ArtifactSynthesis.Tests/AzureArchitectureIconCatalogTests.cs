using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class AzureArchitectureIconCatalogTests
{
    [Fact]
    public void Catalog_resolves_official_svg_for_mapped_resource_and_keeps_unknown_types_on_pictogram_fallback()
    {
        AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();

        AzureArchitectureIconCatalogEntry? virtualMachine =
            catalog.Resolve("Microsoft.Compute/virtualMachines");
        AzureArchitectureIconCatalogEntry? unknown =
            catalog.Resolve("Microsoft.Example/unknown");

        virtualMachine.Should().NotBeNull();
        virtualMachine!.SvgMarkup.Should().Contain("<svg");
        virtualMachine.SvgMarkup.Should().NotContain("data:image/png");
        unknown.Should().BeNull();
    }

    [Fact]
    public void Catalog_resolves_function_app_kind_instead_of_generic_app_service()
    {
        AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();

        catalog.Resolve("Microsoft.Web/sites", "functionapp")!.Service.Should().Be("Function Apps");
        catalog.Resolve("Microsoft.Web/sites")!.Service.Should().Be("App Services");
    }

    [Fact]
    public void Renderer_emits_official_svg_group_and_preserves_category_pictogram_fallback()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (Network)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "unknown",
                    Label = "unknown-resource",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Example/unknown",
                    OrderKey = 1,
                },
            ],
        };

        DiagramForestLayoutResult result = new DiagramForestLayoutSvgRenderer().Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("class=\"azure-icon\"");
        result.Svg.Should().Contain("data-file=\"Svg/virtual-machine.svg\"");
        result.Svg.Should().Contain("class=\"pictogram\"");
        result.Svg.Should().NotContain("data:image/png");
        result.Svg.Should().NotContain("https://");
    }
}
