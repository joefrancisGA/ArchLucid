using System.Text.Json;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphResolverDuplicateNicPropertyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/";
    private const string Vm = Prefix + "microsoft.compute/virtualmachines/vm";
    private const string Pe = Prefix + "microsoft.network/privateendpoints/pe";
    private const string Vault = Prefix + "microsoft.recoveryservices/vaults/vault";
    private const string NicA = Prefix + "microsoft.network/networkinterfaces/a";
    private const string NicB = Prefix + "microsoft.network/networkinterfaces/b";
    private const string NicC = Prefix + "microsoft.network/networkinterfaces/c";

    public static IEnumerable<object[]> Scenarios => new[]
    {
        "pe-multiple", "vm-multiple", "nic-marker", "unrelated", "blank-first", "same-value", "vm-relationship", "recovery",
    }.SelectMany(mode => new[] { "unique", "duplicate" }.Select(shape => new object[] { mode + ":" + shape }));

    [Theory]
    [MemberData(nameof(Scenarios))]
    public void Catalog_unions_all_nic_signals_without_mutating_or_discarding_property_rows(string scenario)
    {
        AzureInventorySnapshotDetailReadModel snapshot = Snapshot(scenario);
        var originalRows = snapshot.Properties.ToArray();
        string originalJson = JsonSerializer.Serialize(snapshot);
        HashSet<string> omitted = AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIdsFromSnapshot(
            snapshot.Resources, snapshot.Relationships, snapshot.Properties);
        Assert.Equal(ExpectedOmitted(scenario), omitted.OrderBy(id => id, StringComparer.Ordinal));
        HashSet<string> reversed = AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIdsFromSnapshot(
            snapshot.Resources.Reverse().ToArray(), snapshot.Relationships.Reverse().ToArray(), snapshot.Properties.Reverse().ToArray());
        Assert.True(omitted.SetEquals(reversed));

        AzureInventorySnapshotDetailReadModel projected = AzureInventoryVisibleSnapshotProjection.Apply(snapshot);
        var retainedRows = originalRows.Where(row => projected.Resources.Any(resource => resource.ResourceRowId == row.ResourceRowId)).ToArray();
        Assert.Equal(retainedRows.Length, projected.Properties.Count);
        for (int index = 0; index < retainedRows.Length; index++) Assert.Same(retainedRows[index], projected.Properties[index]);
        Assert.Equal(originalJson, JsonSerializer.Serialize(snapshot));
    }

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Default_graph_resolves_duplicate_properties_and_keeps_vm_attached_nics(string scenario)
    {
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        string[] omitted = ExpectedOmitted(scenario);
        foreach (string nic in new[] { NicA, NicB, NicC })
        {
            Assert.Equal(!omitted.Contains(nic, StringComparer.Ordinal), graph.Nodes.Any(node => node.SourceId == nic));
        }
        Assert.Contains(graph.Nodes, node => node.SourceId == Vm);
        Assert.Contains(graph.Nodes, node => node.SourceId == Pe);
        if (scenario.StartsWith("recovery:", StringComparison.Ordinal))
        {
            GraphEdge edge = Assert.Single(graph.Edges, candidate => candidate.EdgeType == GraphEdgeTypes.Protects);
            Assert.Equal(AzureInventoryRecoveryServices.BackupEdgeLabel, edge.Label);
            Assert.Equal(GraphEdgeInferenceSources.InventoryRecoveryServicesProtects, edge.InferenceSource);
            Assert.Equal(nameof(ProvenanceKind.ObservedFact), edge.ProvenanceKind);
        }
        Assert.All(graph.Edges, edge =>
        {
            Assert.Contains(graph.Nodes, node => node.NodeId == edge.FromNodeId);
            Assert.Contains(graph.Nodes, node => node.NodeId == edge.ToNodeId);
        });
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        var snapshot = Snapshot(scenario);
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(repo => repo.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repository.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshot.Header.SnapshotId);
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static string[] ExpectedOmitted(string scenario) => scenario.Split(':')[0] switch
    {
        "pe-multiple" => [NicA, NicB],
        "vm-multiple" => [NicC],
        "nic-marker" or "blank-first" or "same-value" => [NicA],
        "vm-relationship" => [NicB],
        _ => [],
    };

    private static AzureInventorySnapshotDetailReadModel Snapshot(string scenario)
    {
        string mode = scenario.Split(':')[0];
        bool duplicate = scenario.EndsWith(":duplicate", StringComparison.Ordinal);
        Guid Row(int index) => Guid.Parse($"00000000-0000-0000-0000-{index:D12}");
        List<AzureInventoryResourcePropertyReadModel> properties = [];
        void Pair(int owner, string key, string? first, string? second)
        {
            properties.Add(new() { ResourceRowId = Row(owner), PropertyKey = duplicate ? key : key + "[0]", PropertyValue = first });
            properties.Add(new() { ResourceRowId = Row(owner), PropertyKey = duplicate ? key.ToUpperInvariant() : key + "[1]", PropertyValue = second });
        }
        switch (mode)
        {
            case "pe-multiple": case "vm-relationship":
                Pair(2, "networkInterfaces", NicA, "  " + NicB.ToUpperInvariant() + "  ");
                break;
            case "vm-multiple":
                Pair(1, "networkProfile.networkInterfaces", NicA, NicB);
                Pair(2, "networkInterfaces", NicA, NicB);
                properties.Add(new() { ResourceRowId = Row(2), PropertyKey = "networkInterfaces[2]", PropertyValue = NicC });
                break;
            case "nic-marker": Pair(3, "privateEndpoint.id", " ", Pe); break;
            case "unrelated": Pair(1, "custom.property", "arm value", "other source value"); break;
            case "blank-first": Pair(2, "networkInterfaces", null, NicA); break;
            case "same-value": Pair(2, "networkInterfaces", NicA, "  " + NicA.ToUpperInvariant() + "  "); break;
            case "recovery":
                string Items(bool replication) => JsonSerializer.Serialize(new[] { new AzureInventoryRecoveryServicesProtectedItemRow
                {
                    VaultResourceId = Vault, SourceResourceId = Vm,
                    ItemKind = replication ? AzureInventoryRecoveryServices.ReplicationItemKind : AzureInventoryRecoveryServices.BackupItemKind,
                } });
                if (duplicate) Pair(6, AzureInventoryRecoveryServices.ProtectedItemsPropertyKey, Items(false), Items(true));
                else properties.Add(new() { ResourceRowId = Row(6), PropertyKey = AzureInventoryRecoveryServices.ProtectedItemsPropertyKey, PropertyValue = Items(false) });
                break;
        }
        string[] ids = [Vm, Pe, NicA, NicB, NicC, Vault];
        string[] types = ["Microsoft.Compute/virtualMachines", "Microsoft.Network/privateEndpoints", "Microsoft.Network/networkInterfaces",
            "Microsoft.Network/networkInterfaces", "Microsoft.Network/networkInterfaces", AzureInventoryRecoveryServices.VaultResourceType];
        return new()
        {
            Header = new()
            {
                SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = ids.Select((id, index) => new AzureInventoryResourceRecord
            {
                ResourceRowId = Row(index + 1), AzureResourceId = id, ResourceType = types[index], ResourceGroup = "rg", SubscriptionId = "sub",
            }).ToArray(),
            Properties = properties,
            Relationships = mode == "vm-relationship" ? [new()
            {
                FromAzureResourceId = Vm, ToAzureResourceId = NicA, RelationshipType = GraphEdgeTypes.ConnectsTo,
                InferenceSource = "inventory-vm-nic", ProvenanceKind = ProvenanceKind.ObservedFact,
            }] : [],
        };
    }
}
