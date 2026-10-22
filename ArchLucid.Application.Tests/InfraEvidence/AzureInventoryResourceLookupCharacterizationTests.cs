using System.Text.Json;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryResourceLookupCharacterizationTests
{
    private const string OwnerId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/owner";
    private const string TargetId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/target";
    private const string VaultId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/vault";
    private static readonly Guid OwnerRow = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TargetRow = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Theory]
    [InlineData("normal", 1)]
    [InlineData("duplicateOwner", 1)]
    [InlineData("duplicateTarget", 1)]
    [InlineData("firstTargetNonConnection", 1)]
    [InlineData("redacted", 0)]
    [InlineData("orphan", 0)]
    [InlineData("blank", 0)]
    [InlineData("missingOwner", 0)]
    [InlineData("missingTarget", 0)]
    [InlineData("ancestorOwner", 1)]
    [InlineData("ancestorTarget", 1)]
    [InlineData("privateLink", 0)]
    [InlineData("peering", 0)]
    public void Property_references_preserve_lookup_and_evidence_policy(string scenario, int count)
    {
        (AzureInventorySnapshotDetailReadModel snapshot, Dictionary<string, string> nodes) = PropertyFixture(scenario);
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);

        AzureInventorySnapshotPropertyArmIdEdgeHydrator.AddMissingPropertyArmIdEdges(snapshot, nodes, edges, keys);

        Assert.Equal(count, edges.Count);
        Assert.Equal(count, keys.Count);
        if (count == 0)
        {
            return;
        }

        GraphEdge edge = Assert.Single(edges);
        bool generic = scenario is "firstTargetNonConnection" or "ancestorTarget";
        Assert.Equal("owner", edge.FromNodeId);
        Assert.Equal("target", edge.ToNodeId);
        Assert.Equal(generic ? GraphEdgeTypes.ConnectsTo : AzureInventoryRelationshipAssociationTypes.LogicAppConnection, edge.EdgeType);
        Assert.Equal(generic ? GraphEdgeInferenceSources.InventoryPropertyArmId : GraphEdgeInferenceSources.InventoryLogicAppConnection, edge.InferenceSource);
        Assert.Equal(ProvenanceKind.DeterministicInference.ToString(), edge.ProvenanceKind);
        Assert.Equal(edge.EdgeType, edge.Label);
        Assert.Equal($"edge-owner|target|{edge.EdgeType}", edge.EdgeId);
        Assert.Empty(edge.Properties);
    }

    [Theory]
    [InlineData("normal", 1)]
    [InlineData("replication", 1)]
    [InlineData("redacted", 1)]
    [InlineData("self", 1)]
    [InlineData("duplicateVault", 1)]
    [InlineData("firstNonVault", 0)]
    [InlineData("orphan", 0)]
    [InlineData("blank", 0)]
    [InlineData("invalid", 0)]
    [InlineData("failed", 0)]
    [InlineData("missingTarget", 0)]
    [InlineData("ancestorOnly", 0)]
    public void Recovery_services_preserves_lookup_and_evidence_policy(string scenario, int count)
    {
        (AzureInventorySnapshotDetailReadModel snapshot, Dictionary<string, string> nodes) = RecoveryFixture(scenario);
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);

        AzureInventorySnapshotRecoveryServicesEdgeHydrator.AddMissingProtectionEdges(snapshot, nodes, edges, keys);

        Assert.Equal(count, edges.Count);
        Assert.Equal(count, keys.Count);
        if (count == 0)
        {
            return;
        }

        GraphEdge edge = Assert.Single(edges);
        Assert.Equal("vault", edge.FromNodeId);
        Assert.Equal(scenario == "self" ? "vault" : "target", edge.ToNodeId);
        Assert.Equal(GraphEdgeTypes.Protects, edge.EdgeType);
        Assert.Equal(scenario == "replication" ? AzureInventoryRecoveryServices.ReplicateEdgeLabel : AzureInventoryRecoveryServices.BackupEdgeLabel, edge.Label);
        Assert.Equal(scenario == "replication" ? GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates : GraphEdgeInferenceSources.InventoryRecoveryServicesProtects, edge.InferenceSource);
        Assert.Equal(ProvenanceKind.ObservedFact.ToString(), edge.ProvenanceKind);
        Assert.Equal($"edge-vault|{edge.ToNodeId}|{edge.EdgeType}", edge.EdgeId);
        Assert.Equal(2, edge.Properties.Count);
        Assert.Equal("westus", edge.Properties[AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey]);
        Assert.Equal(ArmResourceIdNormalizer.Normalize(TargetId), edge.Properties[AzureInventoryRecoveryServices.EdgeTargetResourceIdPropertyKey]);
    }

    internal static (AzureInventorySnapshotDetailReadModel, Dictionary<string, string>) PropertyFixture(string scenario)
    {
        string ownerId = scenario == "ancestorOwner" ? OwnerId + "/children/child" : OwnerId;
        string targetId = scenario == "ancestorTarget" ? TargetId + "/children/child" : TargetId;
        List<AzureInventoryResourceRecord> resources =
        [
            Resource(OwnerRow, ownerId, scenario == "privateLink" ? "Microsoft.Network/privateEndpoints" : "Microsoft.Logic/workflows"),
            Resource(TargetRow, " " + TargetId.ToUpperInvariant() + "/ ", scenario == "firstTargetNonConnection" ? "Microsoft.Compute/virtualMachines" : "Microsoft.Web/connections"),
        ];
        if (scenario == "duplicateOwner")
        {
            resources.Add(Resource(OwnerRow, TargetId, "Microsoft.Compute/virtualMachines"));
        }
        if (scenario is "duplicateTarget" or "firstTargetNonConnection")
        {
            resources.Add(Resource(Guid.Empty, TargetId, scenario == "duplicateTarget" ? "Microsoft.Compute/virtualMachines" : "Microsoft.Web/connections"));
        }
        Dictionary<string, string> nodes = new(StringComparer.OrdinalIgnoreCase)
        {
            [ArmResourceIdNormalizer.Normalize(OwnerId)] = "owner",
            [ArmResourceIdNormalizer.Normalize(TargetId)] = "target",
        };
        if (scenario == "missingOwner") nodes.Remove(ArmResourceIdNormalizer.Normalize(OwnerId));
        if (scenario == "missingTarget") nodes.Remove(ArmResourceIdNormalizer.Normalize(TargetId));

        return (new AzureInventorySnapshotDetailReadModel
        {
            Resources = resources,
            Properties = [new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = scenario == "orphan" ? Guid.Empty : OwnerRow,
                PropertyKey = scenario == "privateLink" ? "privateLinkServiceId[0]" : scenario == "peering" ? AzureInventoryVnetPeeringParser.PeeringsPropertyKey : "reference",
                PropertyValue = scenario == "blank" ? " " : targetId,
                IsRedacted = scenario == "redacted",
            }],
        }, nodes);
    }

    internal static (AzureInventorySnapshotDetailReadModel, Dictionary<string, string>) RecoveryFixture(string scenario)
    {
        List<AzureInventoryResourceRecord> resources =
        [Resource(OwnerRow, " " + VaultId.ToUpperInvariant() + "/ ", scenario == "firstNonVault" ? "Microsoft.Compute/virtualMachines" : AzureInventoryRecoveryServices.VaultResourceType)];
        if (scenario is "duplicateVault" or "firstNonVault")
        {
            resources.Add(Resource(OwnerRow, OwnerId, scenario == "duplicateVault" ? "Microsoft.Compute/virtualMachines" : AzureInventoryRecoveryServices.VaultResourceType));
        }
        string sourceId = scenario == "self" ? VaultId : scenario == "ancestorOnly" ? TargetId + "/children/child" : TargetId;
        string value = JsonSerializer.Serialize(new[] { new AzureInventoryRecoveryServicesProtectedItemRow
        {
            SourceResourceId = sourceId.ToUpperInvariant() + "/",
            ItemKind = scenario == "replication" ? AzureInventoryRecoveryServices.ReplicationItemKind : AzureInventoryRecoveryServices.BackupItemKind,
            CollectionStatus = scenario == "failed" ? "Failed" : AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            TargetRegion = "westus",
            TargetResourceId = " " + TargetId.ToUpperInvariant() + "/ ",
        } });
        Dictionary<string, string> nodes = new(StringComparer.OrdinalIgnoreCase)
        {
            [ArmResourceIdNormalizer.Normalize(VaultId)] = "vault",
            [ArmResourceIdNormalizer.Normalize(TargetId)] = "target",
        };
        if (scenario == "missingTarget") nodes.Remove(ArmResourceIdNormalizer.Normalize(TargetId));

        return (new AzureInventorySnapshotDetailReadModel
        {
            Resources = resources,
            Properties = [new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = scenario == "orphan" ? Guid.Empty : OwnerRow,
                PropertyKey = AzureInventoryRecoveryServices.ProtectedItemsPropertyKey.ToUpperInvariant(),
                PropertyValue = scenario == "blank" ? " " : scenario == "invalid" ? "{" : value,
                IsRedacted = scenario == "redacted",
            }],
        }, nodes);
    }

    private static AzureInventoryResourceRecord Resource(Guid rowId, string id, string type) => new()
    {
        ResourceRowId = rowId,
        AzureResourceId = id,
        ResourceType = type,
    };
}
