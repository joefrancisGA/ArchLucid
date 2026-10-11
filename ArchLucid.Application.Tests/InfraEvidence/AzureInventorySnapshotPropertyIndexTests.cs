using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotPropertyIndexTests
{
    [Fact]
    public void Final_node_indexes_reuse_the_snapshot_property_rows_instead_of_regrouping()
    {
        Guid row = Guid.NewGuid();
        AzureInventoryResourcePropertyReadModel first = new() { ResourceRowId = row, PropertyKey = "key", PropertyValue = "first" };
        AzureInventoryResourcePropertyReadModel second = new() { ResourceRowId = row, PropertyKey = "KEY", IsRedacted = true };
        AzureInventorySnapshotDetailReadModel snapshot = new() { Properties = [first, second] };
        var propertyIndex = AzureInventorySnapshotPropertyIndex.Create(snapshot);
        var graphIndexes = AzureInventorySnapshotGraphIndexes.Create(snapshot, [], propertyIndex);
        Assert.Same(propertyIndex.ByResourceRowId, graphIndexes.PropertiesByResourceRowId);
        var rows = graphIndexes.PropertiesByResourceRowId[row];
        Assert.Same(first, rows[0]);
        Assert.Same(second, rows[1]);
    }

    [Fact]
    public void Visible_snapshot_has_its_own_index_without_hidden_resource_property_rows()
    {
        Guid visibleRow = Guid.NewGuid();
        Guid hiddenRow = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new(),
            Resources = [new() { ResourceRowId = visibleRow, AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm", ResourceType = "Microsoft.Compute/virtualMachines" },
                new() { ResourceRowId = hiddenRow, AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity", ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities" }],
            Properties = [new() { ResourceRowId = visibleRow, PropertyKey = "identity", PropertyValue = "visible" },
                new() { ResourceRowId = hiddenRow, PropertyKey = "identity", PropertyValue = "hidden" }],
        };
        var visible = AzureInventoryVisibleSnapshotProjection.Apply(snapshot);
        var allRows = AzureInventorySnapshotPropertyIndex.Create(snapshot);
        var visibleRows = AzureInventorySnapshotPropertyIndex.Create(visible);
        Assert.Equal(2, allRows.ByResourceRowId.Count);
        Assert.Single(visibleRows.ByResourceRowId);
        Assert.False(visibleRows.ByResourceRowId.ContainsKey(hiddenRow));
        Assert.Same(snapshot.Properties[0], visibleRows.ByResourceRowId[visibleRow][0]);
    }
}
