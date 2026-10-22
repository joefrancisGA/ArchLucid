using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramInventoryAzureIconResolverTests
{
    [Fact]
    public void Resolve_host_pool_uses_virtual_machine_icon()
    {
        DiagramNode node = new()
        {
            NodeId = "host-pool",
            Label = "pool",
            ArmResourceId =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool",
            ArmResourceType = "Microsoft.DesktopVirtualization/hostPools",
        };

        AzureArchitectureIconCatalogEntry? icon = DiagramInventoryAzureIconResolver.Resolve(node);

        icon.Should().NotBeNull();
        icon!.File.Should().Be("Svg/virtual-machine.svg");
    }
}
