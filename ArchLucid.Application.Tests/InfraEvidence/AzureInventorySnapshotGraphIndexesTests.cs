using System.Text.Json;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphIndexesTests
{
    [Theory]
    [MemberData(nameof(AzureInventorySnapshotMetadataIndexPolicyTests.Scenarios), MemberType = typeof(AzureInventorySnapshotMetadataIndexPolicyTests))]
    public async Task Shared_indexes_and_independent_hydration_produce_identical_metadata(string scenario)
    {
        var independent = await AzureInventorySnapshotMetadataIndexPolicyTests.ResolveScenarioAsync(scenario);
        var shared = await AzureInventorySnapshotMetadataIndexPolicyTests.ResolveWithSharedIndexesAsync(scenario);
        Assert.Equal(JsonSerializer.Serialize(independent), JsonSerializer.Serialize(shared));
    }

    [Fact]
    public void Property_index_retains_duplicate_values_redaction_row_order_and_original_objects()
    {
        Guid owner = Guid.Parse("00000000-0000-0000-0000-000000000001");
        Guid missingOwner = Guid.Parse("00000000-0000-0000-0000-000000000002");
        AzureInventoryResourcePropertyReadModel first = new() { ResourceRowId = owner, PropertyKey = "key", PropertyValue = "first" };
        AzureInventoryResourcePropertyReadModel redacted = new() { ResourceRowId = owner, PropertyKey = "KEY", PropertyValue = "redacted", IsRedacted = true };
        AzureInventoryResourcePropertyReadModel later = new() { ResourceRowId = owner, PropertyKey = "key", PropertyValue = null };
        AzureInventoryResourcePropertyReadModel unmatched = new() { ResourceRowId = missingOwner, PropertyKey = "other", PropertyValue = "kept" };
        AzureInventorySnapshotDetailReadModel snapshot = new() { Properties = [first, redacted, unmatched, later] };
        string before = JsonSerializer.Serialize(snapshot);
        AzureInventorySnapshotGraphIndexes indexes = AzureInventorySnapshotGraphIndexes.Create(snapshot, []);
        Assert.Equal(2, indexes.PropertiesByResourceRowId.Count);
        var rows = indexes.PropertiesByResourceRowId[owner];
        Assert.Equal(3, rows.Count);
        Assert.Same(first, rows[0]);
        Assert.Same(redacted, rows[1]);
        Assert.Same(later, rows[2]);
        Assert.Same(unmatched, Assert.Single(indexes.PropertiesByResourceRowId[missingOwner]));
        Assert.Equal(before, JsonSerializer.Serialize(snapshot));
    }

    [Fact]
    public void Arm_index_uses_first_normalized_property_id_and_ignores_missing_or_blank_ids()
    {
        const string armId = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.compute/virtualmachines/vm";
        GraphNode first = new() { NodeId = "first", Properties = new() { ["arm.id"] = armId } };
        GraphNode later = new() { NodeId = "later", Properties = new() { ["arm.id"] = "  " + armId.ToUpperInvariant() + "  " } };
        GraphNode onlySource = new() { NodeId = "source-only", SourceId = armId };
        GraphNode blank = new() { NodeId = "blank", Properties = new() { ["arm.id"] = " " } };
        GraphNode empty = new() { NodeId = "empty", Properties = new() { ["arm.id"] = "" } };
        AzureInventorySnapshotGraphIndexes indexes = AzureInventorySnapshotGraphIndexes.Create(new(), [first, later, onlySource, blank, empty]);
        Assert.Single(indexes.NodesByArmId);
        Assert.Same(first, indexes.NodesByArmId[armId.ToUpperInvariant()]);
        first.Properties["metadata"] = "hydrated";
        Assert.Equal("hydrated", indexes.NodesByArmId[armId].Properties["metadata"]);
        Assert.False(later.Properties.ContainsKey("metadata"));
    }
}
