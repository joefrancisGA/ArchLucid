using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotPrivateEndpointEdgePolicyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/";
    private const string Source = Prefix + "microsoft.network/privateendpoints/pe";
    private const string Target = Prefix + "microsoft.storage/storageaccounts/storage";
    private const string Child = Target + "/blobservices/default";
    private const string Hidden = Prefix + "microsoft.managedidentity/userassignedidentities/identity";
    private const string EdgeType = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget;
    private const string SourceReference = "snapshot:private-endpoint-source";
    private static readonly Guid OwnerRow = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static IEnumerable<object[]> Scenarios => new[]
    {
        "exact", "descendants", "children-only", "ancestor", "missing", "hidden-collected", "hidden-absent",
        "redacted", "blank", "invalid", "self", "explicit", "reverse", "indexed", "wrong-index", "by-id", "no-reference",
    }.SelectMany(mode => new[] { "default", "included" }.Select(view => new object[] { mode + ":" + view }));

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Private_link_edges_preserve_targets_visibility_and_evidence(string scenario)
    {
        string mode = scenario.Split(':')[0];
        bool included = scenario.EndsWith(":included", StringComparison.Ordinal);
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        GraphEdge[] forward = graph.Edges.Where(edge => edge.EdgeType == EdgeType
            && graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId == Source).ToArray();
        bool suppressed = mode is "redacted" or "blank" or "invalid" or "self" or "wrong-index"
            || (!included && mode is "hidden-collected" or "hidden-absent");
        Assert.Equal(suppressed ? 0 : mode == "descendants" ? 2 : 1, forward.Length);
        foreach (GraphEdge edge in forward)
        {
            string targetArmId = ReferenceTarget(mode);
            string resolvedTarget = graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId!;
            Assert.Contains(resolvedTarget, mode == "descendants" ? new[] { Target, Child } : new[]
            {
                mode == "children-only" ? Child : mode == "ancestor" ? Target : targetArmId,
            });
            Assert.Equal(mode == "explicit" ? "explicit-first" : GraphEdgeInferenceSources.InventoryPrivateEndpoint, edge.InferenceSource);
            Assert.Equal(mode == "explicit" ? nameof(ProvenanceKind.HumanAssertion) : nameof(ProvenanceKind.DeterministicInference), edge.ProvenanceKind);
            Assert.Equal(mode == "explicit" ? Declaration.ToString() : null, edge.DeclaredConnectionId);
            Assert.Equal(EdgeType, edge.Label);
            Assert.Equal(1d, edge.Weight);
            Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{EdgeType}", edge.EdgeId);
            Assert.Equal(mode == "indexed" ? "privateLinkServiceId[10]" : "privateLinkServiceId", edge.Properties["evidence.propertyKey"]);
            Assert.Equal(OwnerRow.ToString("D"), edge.Properties["evidence.resourceRowId"]);
            Assert.Equal(targetArmId, edge.Properties["evidence.targetArmId"]);
            if (mode == "no-reference") Assert.False(edge.Properties.ContainsKey("evidence.sourceReference"));
            else Assert.Equal(SourceReference, edge.Properties["evidence.sourceReference"]);
        }
        GraphNode[] references = graph.Nodes.Where(node => node.Properties.GetValueOrDefault("arm.stub") == "referenced-resource").ToArray();
        Assert.Equal(mode == "missing" || (mode == "hidden-absent" && included) ? 1 : 0, references.Length);
        Assert.All(references, node => Assert.Equal("referenced-not-collected", node.Properties["inventory.collectionStatus"]));
        if (mode == "reverse")
        {
            GraphEdge reverse = Assert.Single(graph.Edges, edge => edge.EdgeType == EdgeType && !forward.Contains(edge));
            Assert.Equal("explicit-first", reverse.InferenceSource);
            Assert.Equal(nameof(ProvenanceKind.HumanAssertion), reverse.ProvenanceKind);
            Assert.Equal(Declaration.ToString(), reverse.DeclaredConnectionId);
            Assert.Equal("Current", reverse.Properties["inventory.indirectRelationship.evidenceCurrency"]);
            Assert.Equal("explicit-first", reverse.Properties["inventory.indirectRelationship.evidenceSource"]);
            Assert.DoesNotContain(reverse.Properties.Keys, key => key.StartsWith("evidence.", StringComparison.Ordinal));
        }
    }

    public static IEnumerable<object[]> ExistingEvidenceCases => new string?[]
        { "ObservedFact", "HumanAssertion", "DerivedFact", "DeterministicInference", "unknown", null, " " }
        .SelectMany(provenance => new[] { false, true }.Select(keyPresent => new object[] { provenance!, keyPresent }));

    [Theory]
    [MemberData(nameof(ExistingEvidenceCases))]
    public void Existing_edge_gains_missing_evidence_without_overwriting_original_metadata(string? provenance, bool keyPresent)
    {
        GraphEdge original = new()
        {
            EdgeId = "original", FromNodeId = "source", ToNodeId = "target", EdgeType = EdgeType,
            Label = "custom", Weight = 0.42d, InferenceSource = "custom-source", ProvenanceKind = provenance,
            DeclaredConnectionId = Declaration.ToString(), ReasoningTrace = "original explanation",
        };
        original.Properties["evidence.targetArmId"] = "original target evidence";
        original.Properties["evidence.sourceReference"] = "original source evidence";
        original.Properties["other"] = "kept";
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal);
        if (keyPresent) keys.Add($"source|target|{EdgeType}");
        Hydrate(NodeMap(), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Equal(keyPresent ? 1 : 0, keys.Count);
        Assert.Equal("original", original.EdgeId);
        Assert.Equal("custom", original.Label);
        Assert.Equal(0.42d, original.Weight);
        Assert.Equal("custom-source", original.InferenceSource);
        Assert.Equal(provenance, original.ProvenanceKind);
        Assert.Equal(Declaration.ToString(), original.DeclaredConnectionId);
        Assert.Equal("original explanation", original.ReasoningTrace);
        Assert.Equal("original target evidence", original.Properties["evidence.targetArmId"]);
        Assert.Equal("original source evidence", original.Properties["evidence.sourceReference"]);
        Assert.Equal("privateLinkServiceId", original.Properties["evidence.propertyKey"]);
        Assert.Equal(OwnerRow.ToString("D"), original.Properties["evidence.resourceRowId"]);
        Assert.Equal("kept", original.Properties["other"]);
    }

    [Fact]
    public void Key_without_edge_prevents_insertion()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { $"source|target|{EdgeType}" };
        Hydrate(NodeMap(), edges, keys);
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    [Fact]
    public void Repeated_hydration_preserves_object_and_evidence()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(NodeMap(), edges, keys);
        GraphEdge original = Assert.Single(edges);
        Hydrate(NodeMap(), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Equal(4, original.Properties.Count);
        Assert.Equal(nameof(ProvenanceKind.DeterministicInference), original.ProvenanceKind);
    }

    [Fact]
    public void Missing_source_adds_no_edge_or_key()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(new(StringComparer.OrdinalIgnoreCase) { [Target] = "target" }, edges, keys);
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    [Fact]
    public void Same_resolved_node_adds_no_edge_or_key()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(new(StringComparer.OrdinalIgnoreCase) { [Source] = "same", [Target] = "same" }, edges, keys);
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    [Fact]
    public void Unrelated_edge_is_not_enriched_or_replaced()
    {
        GraphEdge unrelated = new() { FromNodeId = "source", ToNodeId = "target", EdgeType = GraphEdgeTypes.ConnectsTo };
        List<GraphEdge> edges = [unrelated];
        Hydrate(NodeMap(), edges, new(StringComparer.Ordinal));
        Assert.Equal(2, edges.Count);
        Assert.Same(unrelated, edges[0]);
        Assert.Empty(unrelated.Properties);
        Assert.Equal(EdgeType, edges[1].EdgeType);
        Assert.Equal(4, edges[1].Properties.Count);
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        var snapshot = Snapshot(scenario.Split(':')[0]);
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(repo => repo.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repository.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshot.Header.SnapshotId, includeNeverShowArmTypes: scenario.EndsWith(":included", StringComparison.Ordinal));
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static Dictionary<string, string> NodeMap() => new(StringComparer.OrdinalIgnoreCase) { [Source] = "source", [Target] = "target" };

    private static void Hydrate(Dictionary<string, string> map, List<GraphEdge> edges, HashSet<string> keys) =>
        AzureInventorySnapshotPrivateEndpointEdgeHydrator.AddMissingTargetEdges(Snapshot("exact"), map, [],
            new(StringComparer.Ordinal), edges, keys, new HashSet<string>(StringComparer.OrdinalIgnoreCase) { Source, Target },
            new HashSet<string>(StringComparer.OrdinalIgnoreCase), false, false);

    private static string ReferenceTarget(string mode) => mode switch
    {
        "ancestor" => Child,
        "hidden-collected" or "hidden-absent" => Hidden,
        "self" => Source,
        _ => Target,
    };

    private static AzureInventorySnapshotDetailReadModel Snapshot(string mode)
    {
        string target = ReferenceTarget(mode);
        List<AzureInventoryResourceRecord> resources = [new()
        {
            ResourceRowId = OwnerRow, AzureResourceId = Source, ResourceType = mode == "by-id" ? "Microsoft.Custom/other" : "Microsoft.Network/privateEndpoints",
            ResourceGroup = "rg", SubscriptionId = "sub", SourceEvidenceReference = mode == "no-reference" ? " " : SourceReference,
        }];
        if (mode is not "missing" and not "hidden-absent" and not "children-only" and not "self") resources.Add(new()
        {
            ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000002"), AzureResourceId = mode == "ancestor" ? Target : target,
            ResourceType = mode == "hidden-collected" ? "Microsoft.ManagedIdentity/userAssignedIdentities" : "Microsoft.Storage/storageAccounts",
            ResourceGroup = "rg", SubscriptionId = "sub",
        });
        if (mode is "descendants" or "children-only") resources.Add(new()
        {
            ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000003"), AzureResourceId = Child,
            ResourceType = "Microsoft.Storage/storageAccounts/blobServices", ResourceGroup = "rg", SubscriptionId = "sub",
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
            Properties = mode == "indexed" ? [Property("privateLinkServiceId[2]"), Property("privateLinkServiceId[10]")]
                : [Property(mode == "wrong-index" ? "privateLinkServiceId[bad]" : "privateLinkServiceId")],
            Relationships = mode is "explicit" or "reverse" ? [new()
            {
                FromAzureResourceId = mode == "reverse" ? Target : Source, ToAzureResourceId = mode == "reverse" ? Source : Target,
                RelationshipType = EdgeType, InferenceSource = "explicit-first", ProvenanceKind = ProvenanceKind.HumanAssertion,
                DeclaredConnectionId = Declaration,
            }] : [],
        };

        AzureInventoryResourcePropertyReadModel Property(string key) => new()
        {
            ResourceRowId = OwnerRow, PropertyKey = key, IsRedacted = mode == "redacted",
            PropertyValue = mode == "blank" ? " " : mode == "invalid" ? "not-an-arm-reference" : "  " + target.ToUpperInvariant() + "  ",
        };
    }
}
