using System.Text.Json;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotResourceIndexTests
{
    [Fact]
    public void Create_rejects_null_snapshot()
    {
        Assert.Throws<ArgumentNullException>(() => AzureInventorySnapshotResourceIndex.Create(null!));
    }

    [Fact]
    public void Create_accepts_empty_resources()
    {
        AzureInventorySnapshotResourceIndex index = AzureInventorySnapshotResourceIndex.Create(new());
        Assert.Empty(index.ByResourceRowId);
        Assert.Empty(index.ByArmId);
    }

    [Fact]
    public void Create_retains_first_rows_independently_for_each_key()
    {
        Guid row = Guid.NewGuid();
        AzureInventoryResourceRecord first = new() { ResourceRowId = row, AzureResourceId = " /RESOURCE/A/ " };
        AzureInventoryResourceRecord sameRow = new() { ResourceRowId = row, AzureResourceId = "/resource/b" };
        AzureInventoryResourceRecord sameArm = new() { ResourceRowId = Guid.NewGuid(), AzureResourceId = "/resource/a" };
        AzureInventorySnapshotDetailReadModel snapshot = new() { Resources = [first, sameRow, sameArm] };

        AzureInventorySnapshotResourceIndex index = AzureInventorySnapshotResourceIndex.Create(snapshot);

        Assert.Same(first, index.ByResourceRowId[row]);
        Assert.Same(sameArm, index.ByResourceRowId[sameArm.ResourceRowId]);
        Assert.Same(first, index.ByArmId["/RESOURCE/A"]);
        Assert.Same(sameRow, index.ByArmId["/resource/b"]);
        Assert.Equal(3, snapshot.Resources.Count);
        Assert.Same(sameRow, snapshot.Resources[1]);
    }

    [Fact]
    public void Create_keeps_blank_arm_rows_in_row_index_and_preserves_nonblank_normalization_to_empty()
    {
        AzureInventoryResourceRecord blank = new() { ResourceRowId = Guid.NewGuid(), AzureResourceId = " " };
        AzureInventoryResourceRecord empty = new() { ResourceRowId = Guid.NewGuid(), AzureResourceId = "" };
        AzureInventoryResourceRecord slash = new() { ResourceRowId = Guid.NewGuid(), AzureResourceId = "/" };

        AzureInventorySnapshotResourceIndex index = AzureInventorySnapshotResourceIndex.Create(new()
        {
            Resources = [blank, empty, slash],
        });

        Assert.Equal(3, index.ByResourceRowId.Count);
        Assert.Same(slash, Assert.Single(index.ByArmId).Value);
        Assert.True(index.ByArmId.ContainsKey(string.Empty));
    }

    [Fact]
    public void Create_matches_legacy_indexes_for_duplicate_resource_sets()
    {
        Random random = new(731);
        for (int sample = 0; sample < 128; sample++)
        {
            List<AzureInventoryResourceRecord> resources = [];
            int resourceCount = random.Next(1, 60);
            for (int i = 0; i < resourceCount; i++)
            {
                resources.Add(new AzureInventoryResourceRecord
                {
                    ResourceRowId = new Guid(random.Next(8), 0, 0, new byte[8]),
                    AzureResourceId = random.Next(5) == 0 ? " " : $" /RESOURCE/{random.Next(12)}/ ",
                });
            }
            AzureInventorySnapshotResourceIndex index = AzureInventorySnapshotResourceIndex.Create(new() { Resources = resources });
            Dictionary<Guid, AzureInventoryResourceRecord> rows = resources.GroupBy(resource => resource.ResourceRowId)
                .ToDictionary(group => group.Key, group => group.First());
            Dictionary<string, AzureInventoryResourceRecord> arms = resources.Where(resource => !string.IsNullOrWhiteSpace(resource.AzureResourceId))
                .GroupBy(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

            Assert.Equal(rows.Count, index.ByResourceRowId.Count);
            Assert.Equal(arms.Count, index.ByArmId.Count);
            foreach ((Guid key, AzureInventoryResourceRecord resource) in rows) Assert.Same(resource, index.ByResourceRowId[key]);
            foreach ((string key, AzureInventoryResourceRecord resource) in arms) Assert.Same(resource, index.ByArmId[key]);
        }
    }

    [Theory]
    [InlineData("normal")]
    [InlineData("duplicateOwner")]
    [InlineData("duplicateTarget")]
    [InlineData("firstTargetNonConnection")]
    [InlineData("redacted")]
    [InlineData("orphan")]
    [InlineData("blank")]
    [InlineData("missingOwner")]
    [InlineData("missingTarget")]
    [InlineData("ancestorOwner")]
    [InlineData("ancestorTarget")]
    [InlineData("privateLink")]
    [InlineData("peering")]
    public void Shared_index_matches_independent_property_hydration(string scenario)
    {
        var (snapshot, nodes) = AzureInventoryResourceLookupCharacterizationTests.PropertyFixture(scenario);
        List<GraphEdge> independent = [];
        List<GraphEdge> shared = [];
        HashSet<string> independentKeys = new(StringComparer.Ordinal);
        HashSet<string> sharedKeys = new(StringComparer.Ordinal);
        AzureInventorySnapshotPropertyArmIdEdgeHydrator.AddMissingPropertyArmIdEdges(snapshot, nodes, independent, independentKeys);
        AzureInventorySnapshotPropertyArmIdEdgeHydrator.AddMissingPropertyArmIdEdges(snapshot, nodes, shared, sharedKeys,
            AzureInventorySnapshotResourceIndex.Create(snapshot));
        Assert.Equal(JsonSerializer.Serialize(independent), JsonSerializer.Serialize(shared));
        Assert.True(independentKeys.SetEquals(sharedKeys));
    }

    [Theory]
    [InlineData("normal")]
    [InlineData("replication")]
    [InlineData("redacted")]
    [InlineData("self")]
    [InlineData("duplicateVault")]
    [InlineData("firstNonVault")]
    [InlineData("orphan")]
    [InlineData("blank")]
    [InlineData("invalid")]
    [InlineData("failed")]
    [InlineData("missingTarget")]
    [InlineData("ancestorOnly")]
    public void Shared_index_matches_independent_recovery_hydration(string scenario)
    {
        var (snapshot, nodes) = AzureInventoryResourceLookupCharacterizationTests.RecoveryFixture(scenario);
        List<GraphEdge> independent = [];
        List<GraphEdge> shared = [];
        HashSet<string> independentKeys = new(StringComparer.Ordinal);
        HashSet<string> sharedKeys = new(StringComparer.Ordinal);
        AzureInventorySnapshotRecoveryServicesEdgeHydrator.AddMissingProtectionEdges(snapshot, nodes, independent, independentKeys);
        AzureInventorySnapshotRecoveryServicesEdgeHydrator.AddMissingProtectionEdges(snapshot, nodes, shared, sharedKeys,
            AzureInventorySnapshotResourceIndex.Create(snapshot));
        Assert.Equal(JsonSerializer.Serialize(independent), JsonSerializer.Serialize(shared));
        Assert.True(independentKeys.SetEquals(sharedKeys));
    }

    [Fact]
    public void Both_hydrators_can_reuse_one_index_without_mutating_it()
    {
        var (propertySnapshot, propertyNodes) = AzureInventoryResourceLookupCharacterizationTests.PropertyFixture("duplicateTarget");
        var (recoverySnapshot, recoveryNodes) = AzureInventoryResourceLookupCharacterizationTests.RecoveryFixture("duplicateVault");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Resources = recoverySnapshot.Resources.Concat(propertySnapshot.Resources
                .Where(resource => resource.ResourceRowId != recoverySnapshot.Resources[0].ResourceRowId)).ToList(),
            Properties = recoverySnapshot.Properties.Concat(propertySnapshot.Properties).ToList(),
        };
        Dictionary<string, string> nodes = new(propertyNodes, StringComparer.OrdinalIgnoreCase);
        foreach ((string armId, string nodeId) in recoveryNodes) nodes.TryAdd(armId, nodeId);
        AzureInventorySnapshotResourceIndex index = AzureInventorySnapshotResourceIndex.Create(snapshot);
        List<GraphEdge> independent = [];
        List<GraphEdge> shared = [];
        HashSet<string> independentKeys = new(StringComparer.Ordinal);
        HashSet<string> sharedKeys = new(StringComparer.Ordinal);
        int rowCount = index.ByResourceRowId.Count;
        int armCount = index.ByArmId.Count;

        AzureInventorySnapshotPropertyArmIdEdgeHydrator.AddMissingPropertyArmIdEdges(snapshot, nodes, independent, independentKeys);
        AzureInventorySnapshotRecoveryServicesEdgeHydrator.AddMissingProtectionEdges(snapshot, nodes, independent, independentKeys);
        AzureInventorySnapshotPropertyArmIdEdgeHydrator.AddMissingPropertyArmIdEdges(snapshot, nodes, shared, sharedKeys, index);
        AzureInventorySnapshotRecoveryServicesEdgeHydrator.AddMissingProtectionEdges(snapshot, nodes, shared, sharedKeys, index);

        Assert.NotEmpty(shared);
        Assert.Equal(JsonSerializer.Serialize(independent), JsonSerializer.Serialize(shared));
        Assert.True(independentKeys.SetEquals(sharedKeys));
        Assert.Equal(rowCount, index.ByResourceRowId.Count);
        Assert.Equal(armCount, index.ByArmId.Count);
    }
}
