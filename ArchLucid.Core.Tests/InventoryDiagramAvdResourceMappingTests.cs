using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramAvdResourceMappingTests
{
    [Fact]
    public void FormatHostPoolBoundaryLabel_uses_stored_host_pool_name_segment()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool-west";

        InventoryDiagramAvdResourceMapping.FormatHostPoolBoundaryLabel(armId).Should().Be("pool-west");
    }

    [Fact]
    public void FormatOmittedAvdSummaryBoundaryLabel_pluralizes_host_pools_and_session_hosts()
    {
        InventoryDiagramAvdResourceMapping.FormatOmittedAvdSummaryBoundaryLabel(2, 3).Should()
            .Be("2 host pools and 3 session hosts omitted from this diagram.");
    }
}
