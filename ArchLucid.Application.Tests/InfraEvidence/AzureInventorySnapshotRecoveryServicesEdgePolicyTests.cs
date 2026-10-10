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

public sealed class AzureInventorySnapshotRecoveryServicesEdgePolicyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/";
    private const string Vault = Prefix + "microsoft.recoveryservices/vaults/vault";
    private const string Source = Prefix + "microsoft.compute/virtualmachines/vm";
    private const string Target = Prefix + "microsoft.compute/virtualmachines/replica";
    private static readonly Guid VaultRow = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static IEnumerable<object[]> Scenarios => new[]
    {
        "backup", "replication", "unknown-kind", "case-insensitive", "backup-first", "replication-first",
        "explicit", "reverse", "missing-source", "self", "redacted",
        "wrong-property", "wrong-type", "invalid-json", "null-json", "empty-json", "blank-value",
        "missing-vault", "wrong-row", "failed", "blank-source", "invalid-source", "no-metadata", "blank-metadata",
    }.Select(mode => new object[] { mode });

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Protection_edges_preserve_labels_provenance_metadata_and_filtering(string mode)
    {
        GraphSnapshot graph = await ResolveScenarioAsync(mode);
        GraphEdge[] forward = graph.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.Protects
            && graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId == Vault).ToArray();
        bool suppressed = mode is "missing-source" or "wrong-property" or "wrong-type" or "invalid-json"
            or "null-json" or "empty-json" or "blank-value" or "missing-vault" or "wrong-row"
            or "failed" or "blank-source" or "invalid-source";
        Assert.Equal(suppressed ? 0 : 1, forward.Length);
        foreach (GraphEdge edge in forward)
        {
            Assert.Equal(mode == "self" ? Vault : Source, graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId);
            bool replication = mode is "replication" or "replication-first" or "case-insensitive";
            Assert.Equal(mode == "explicit" ? GraphEdgeTypes.Protects
                : replication ? AzureInventoryRecoveryServices.ReplicateEdgeLabel : AzureInventoryRecoveryServices.BackupEdgeLabel, edge.Label);
            Assert.Equal(mode == "explicit" ? "explicit-first" : replication
                ? GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates : GraphEdgeInferenceSources.InventoryRecoveryServicesProtects, edge.InferenceSource);
            Assert.Equal(mode == "explicit" ? nameof(ProvenanceKind.HumanAssertion) : nameof(ProvenanceKind.ObservedFact), edge.ProvenanceKind);
            Assert.Equal(mode == "explicit" ? Declaration.ToString() : null, edge.DeclaredConnectionId);
            Assert.Equal(1d, edge.Weight);
            Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{GraphEdgeTypes.Protects}", edge.EdgeId);
            if (mode is "explicit" or "no-metadata" or "blank-metadata")
            {
                Assert.False(edge.Properties.ContainsKey(AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey));
                Assert.False(edge.Properties.ContainsKey(AzureInventoryRecoveryServices.EdgeTargetResourceIdPropertyKey));
            }
            else
            {
                Assert.Equal("  westus2  ", edge.Properties[AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey]);
                Assert.Equal(Target, edge.Properties[AzureInventoryRecoveryServices.EdgeTargetResourceIdPropertyKey]);
            }
        }
        Assert.DoesNotContain(graph.Nodes, node => node.Properties.GetValueOrDefault("arm.stub") == "referenced-resource");
        if (mode == "reverse")
        {
            GraphEdge reverse = Assert.Single(graph.Edges, edge => edge.EdgeType == GraphEdgeTypes.Protects && !forward.Contains(edge));
            Assert.Equal("explicit-first", reverse.InferenceSource);
            Assert.Equal(nameof(ProvenanceKind.HumanAssertion), reverse.ProvenanceKind);
            Assert.Equal(Declaration.ToString(), reverse.DeclaredConnectionId);
            Assert.False(reverse.Properties.ContainsKey(AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey));
        }
    }

    public static IEnumerable<object[]> ExistingCases => new string?[]
        { "ObservedFact", "HumanAssertion", "DerivedFact", "DeterministicInference", "unknown", null, " " }
        .SelectMany(provenance => new[] { false, true }.Select(keyPresent => new object[] { provenance!, keyPresent }));

    [Theory]
    [MemberData(nameof(ExistingCases))]
    public void Duplicate_policy_preserves_original_and_only_consults_key_set(string? provenance, bool keyPresent)
    {
        GraphEdge original = new()
        {
            EdgeId = "original", FromNodeId = "vault", ToNodeId = "vm", EdgeType = GraphEdgeTypes.Protects,
            Label = "custom", Weight = 0.42d, InferenceSource = "custom-source", ProvenanceKind = provenance,
            DeclaredConnectionId = Declaration.ToString(), ReasoningTrace = "original explanation",
        };
        original.Properties[AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey] = "original region";
        original.Properties["other"] = "kept";
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal);
        if (keyPresent) keys.Add($"vault|vm|{GraphEdgeTypes.Protects}");
        Hydrate("backup", NodeMap(), edges, keys);
        Assert.Equal(keyPresent ? 1 : 2, edges.Count);
        Assert.Same(original, edges[0]);
        Assert.Single(keys);
        Assert.Equal("original", original.EdgeId);
        Assert.Equal("custom", original.Label);
        Assert.Equal(0.42d, original.Weight);
        Assert.Equal("custom-source", original.InferenceSource);
        Assert.Equal(provenance, original.ProvenanceKind);
        Assert.Equal(Declaration.ToString(), original.DeclaredConnectionId);
        Assert.Equal("original explanation", original.ReasoningTrace);
        Assert.Equal("original region", original.Properties[AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey]);
        Assert.Equal("kept", original.Properties["other"]);
        Assert.Equal(2, original.Properties.Count);
        if (!keyPresent)
        {
            Assert.Equal(nameof(ProvenanceKind.ObservedFact), edges[1].ProvenanceKind);
            Assert.Equal(Target, edges[1].Properties[AzureInventoryRecoveryServices.EdgeTargetResourceIdPropertyKey]);
        }
    }

    [Fact]
    public void Duplicate_properties_keep_first_edge_and_target_metadata()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate("duplicate-properties", NodeMap(), edges, keys);
        GraphEdge edge = Assert.Single(edges);
        Assert.Single(keys);
        Assert.Equal(AzureInventoryRecoveryServices.BackupEdgeLabel, edge.Label);
        Assert.Equal(GraphEdgeInferenceSources.InventoryRecoveryServicesProtects, edge.InferenceSource);
        Assert.Equal("  westus2  ", edge.Properties[AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey]);
        Assert.Equal(Target, edge.Properties[AzureInventoryRecoveryServices.EdgeTargetResourceIdPropertyKey]);
    }

    [Fact]
    public void Key_without_edge_blocks_insertion()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { $"vault|vm|{GraphEdgeTypes.Protects}" };
        Hydrate("backup", NodeMap(), edges, keys);
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    [Fact]
    public void Repeated_hydration_keeps_first_object_and_metadata()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate("backup", NodeMap(), edges, keys);
        GraphEdge original = Assert.Single(edges);
        Hydrate("replication", NodeMap(), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Equal(AzureInventoryRecoveryServices.BackupEdgeLabel, original.Label);
        Assert.Equal(2, original.Properties.Count);
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("")]
    [InlineData(" ")]
    public void Missing_or_blank_resolved_node_adds_no_edge_or_key(string nodeId)
    {
        Dictionary<string, string> map = NodeMap();
        if (nodeId == "missing") map.Remove(Vault);
        else map[Source] = nodeId;
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate("backup", map, edges, keys);
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    [Fact]
    public void Different_resource_ids_resolving_to_same_node_keep_self_edge()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate("backup", new(StringComparer.OrdinalIgnoreCase) { [Vault] = "same", [Source] = "same" }, edges, keys);
        GraphEdge edge = Assert.Single(edges);
        Assert.Equal("same", edge.FromNodeId);
        Assert.Equal("same", edge.ToNodeId);
        Assert.Single(keys);
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string mode)
    {
        var snapshot = Snapshot(mode);
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

    private static Dictionary<string, string> NodeMap() => new(StringComparer.OrdinalIgnoreCase) { [Vault] = "vault", [Source] = "vm" };

    private static void Hydrate(string mode, Dictionary<string, string> map, List<GraphEdge> edges, HashSet<string> keys) =>
        AzureInventorySnapshotRecoveryServicesEdgeHydrator.AddMissingProtectionEdges(Snapshot(mode), map, edges, keys);

    private static AzureInventorySnapshotDetailReadModel Snapshot(string mode)
    {
        AzureInventoryRecoveryServicesProtectedItemRow Item(bool replication, bool later = false) => new()
        {
            VaultResourceId = Vault,
            ItemKind = mode == "unknown-kind" ? "unknown" : mode == "case-insensitive" ? "REPLICATE"
                : replication ? AzureInventoryRecoveryServices.ReplicationItemKind : AzureInventoryRecoveryServices.BackupItemKind,
            SourceResourceId = mode == "self" ? Vault : mode == "blank-source" ? " " : mode == "invalid-source" ? "invalid" : "  " + Source.ToUpperInvariant() + "  ",
            CollectionStatus = mode == "failed" ? "Failed" : "SUCCEEDED",
            TargetRegion = mode == "no-metadata" ? null : mode == "blank-metadata" ? " " : later ? "later region" : "  westus2  ",
            TargetResourceId = mode == "no-metadata" ? null : mode == "blank-metadata" ? " " : later ? Source : "  " + Target.ToUpperInvariant() + "  ",
        };
        bool replication = mode is "replication" or "replication-first";
        List<AzureInventoryRecoveryServicesProtectedItemRow> items = [Item(replication)];
        if (mode is "backup-first" or "replication-first") items.Add(Item(!replication, true));
        string value = mode switch
        {
            "invalid-json" => "{", "null-json" => "null", "empty-json" => "[]", "blank-value" => " ",
            _ => JsonSerializer.Serialize(items),
        };
        AzureInventoryResourcePropertyReadModel Property(string propertyValue) => new()
        {
            ResourceRowId = mode == "wrong-row" ? Guid.Empty : VaultRow,
            PropertyKey = mode == "wrong-property" ? "other" : AzureInventoryRecoveryServices.ProtectedItemsPropertyKey.ToUpperInvariant(),
            PropertyValue = propertyValue, IsRedacted = mode == "redacted",
        };
        List<AzureInventoryResourceRecord> resources = [];
        if (mode != "missing-vault") resources.Add(new()
        {
            ResourceRowId = VaultRow, AzureResourceId = Vault, ResourceType = mode == "wrong-type" ? "Microsoft.Custom/other" : AzureInventoryRecoveryServices.VaultResourceType.ToUpperInvariant(),
            ResourceGroup = "rg", SubscriptionId = "sub",
        });
        if (mode is not "missing-source" and not "self") resources.Add(new()
        {
            ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000002"), AzureResourceId = Source,
            ResourceType = "Microsoft.Compute/virtualMachines", ResourceGroup = "rg", SubscriptionId = "sub",
        });
        return new()
        {
            Header = new()
            {
                SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = resources,
            Properties = mode == "duplicate-properties" ? [Property(value), Property(JsonSerializer.Serialize(new[] { Item(true, true) }))] : [Property(value)],
            Relationships = mode is "explicit" or "reverse" ? [new()
            {
                FromAzureResourceId = mode == "reverse" ? Source : Vault, ToAzureResourceId = mode == "reverse" ? Vault : Source,
                RelationshipType = GraphEdgeTypes.Protects, InferenceSource = "explicit-first", ProvenanceKind = ProvenanceKind.HumanAssertion,
                DeclaredConnectionId = Declaration,
            }] : [],
        };
    }
}
