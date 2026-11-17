using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramArmSegmentResourceNamesTests
{
    private const string VmArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";

    [Fact]
    public void ResolveRelationshipName_uses_stored_label_when_distinct_from_node_id()
    {
        InventoryDiagramArmSegmentResourceNames
            .ResolveRelationshipName(VmArmId, " checkout ", "node-vm", InventoryDiagramArmSegmentResourceNames.BackendNameNotStored)
            .Should()
            .Be("checkout");
    }

    [Fact]
    public void ResolveRelationshipName_does_not_use_arm_tail_without_stored_label()
    {
        InventoryDiagramArmSegmentResourceNames
            .ResolveRelationshipName(VmArmId, null, "node-vm", InventoryDiagramArmSegmentResourceNames.BackendNameNotStored)
            .Should()
            .Be(InventoryDiagramArmSegmentResourceNames.BackendNameNotStored);
    }

    [Fact]
    public void ResolveRelationshipName_does_not_use_label_that_equals_node_id()
    {
        InventoryDiagramArmSegmentResourceNames
            .ResolveRelationshipName(VmArmId, "node-vm", "node-vm", InventoryDiagramArmSegmentResourceNames.EndpointNameNotStored)
            .Should()
            .Be(InventoryDiagramArmSegmentResourceNames.EndpointNameNotStored);
    }

    [Fact]
    public void ResolveRelationshipName_does_not_use_full_arm_id_as_label()
    {
        InventoryDiagramArmSegmentResourceNames
            .ResolveRelationshipName(VmArmId, VmArmId, "node-vm", InventoryDiagramArmSegmentResourceNames.ResourceNameNotStored)
            .Should()
            .Be(InventoryDiagramArmSegmentResourceNames.ResourceNameNotStored);
    }
}
