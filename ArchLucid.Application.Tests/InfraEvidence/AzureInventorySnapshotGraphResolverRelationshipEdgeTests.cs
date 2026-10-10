using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphResolverRelationshipEdgeTests
{
    private const string Source = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/source";
    private const string Target = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/target";
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static IEnumerable<object[]> Scenarios => new[]
    {
        "duplicate-stronger", "duplicate-weaker", "duplicate-equal", "declared-first", "declared-second",
        "self", "empty-type", "null-source", "whitespace-source", "effective-nsg", "effective-routes",
        "trimmed-type", "source-fallback", "reverse-direction", "different-type",
    }.Select(name => new object[] { name });

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Explicit_edges_preserve_first_duplicate_and_relationship_metadata(string scenario)
    {
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        if (scenario == "self")
        {
            Assert.Empty(graph.Edges);
            return;
        }

        AzureInventoryResourceRelationshipReadModel first = Relationships(scenario)[0];
        string expectedType = scenario switch
        {
            "empty-type" => string.Empty,
            "source-fallback" => "fallback-source",
            _ => GraphEdgeTypes.DependsOn,
        };
        GraphEdge edge = Assert.Single(graph.Edges, candidate => candidate.EdgeType == expectedType
            && graph.Nodes.Single(node => node.NodeId == candidate.FromNodeId).SourceId == Source);
        Assert.Equal(Target, graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId);
        Assert.Equal(expectedType, edge.Label);
        Assert.Equal(first.InferenceSource, edge.InferenceSource);
        Assert.Equal(first.ProvenanceKind.ToString(), edge.ProvenanceKind);
        Assert.Equal(first.DeclaredConnectionId?.ToString(), edge.DeclaredConnectionId);
        Assert.Equal(1d, edge.Weight);
        Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{expectedType}", edge.EdgeId);
        Assert.Equal(scenario is "reverse-direction" or "different-type" ? 2 : 1, graph.Edges.Count);
        if (scenario == "reverse-direction")
            Assert.Contains(graph.Edges, candidate => candidate.FromNodeId == edge.ToNodeId && candidate.ToNodeId == edge.FromNodeId);
        if (scenario == "different-type")
            Assert.Contains(graph.Edges, candidate => candidate.EdgeType == "CUSTOM_TYPE");
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId, TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = [Resource(Source, 1), Resource(Target, 2)],
            Relationships = Relationships(scenario),
        };
        Mock<IAzureInventorySnapshotRepository> repo = new(MockBehavior.Strict);
        repo.Setup(repository => repository.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repo.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshotId);
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static AzureInventoryResourceRelationshipReadModel[] Relationships(string scenario) => scenario switch
    {
        "duplicate-stronger" => [Relationship(ProvenanceKind.DeterministicInference), Relationship(ProvenanceKind.ObservedFact, source: "second")],
        "duplicate-weaker" => [Relationship(ProvenanceKind.ObservedFact), Relationship(ProvenanceKind.DeterministicInference, source: "second")],
        "duplicate-equal" => [Relationship(), Relationship(source: "second")],
        "declared-first" => [Relationship(declaration: Declaration), Relationship(source: "second")],
        "declared-second" => [Relationship(), Relationship(declaration: Declaration, source: "second")],
        "self" => [Relationship(target: Source)],
        "empty-type" => [Relationship(type: " ", source: null)],
        "null-source" => [Relationship(source: null)],
        "whitespace-source" => [Relationship(source: " ")],
        "effective-nsg" => [Relationship(source: GraphEdgeInferenceSources.InventoryEffectiveNsg)],
        "effective-routes" => [Relationship(source: GraphEdgeInferenceSources.InventoryEffectiveRoutes)],
        "trimmed-type" => [Relationship(type: "  " + GraphEdgeTypes.DependsOn + "  ")],
        "source-fallback" => [Relationship(type: " ", source: "  fallback-source  ")],
        "reverse-direction" => [Relationship(), Relationship(from: Target, target: Source)],
        "different-type" => [Relationship(), Relationship(type: "CUSTOM_TYPE")],
        _ => throw new ArgumentOutOfRangeException(nameof(scenario)),
    };

    private static AzureInventoryResourceRelationshipReadModel Relationship(
        ProvenanceKind provenance = ProvenanceKind.ObservedFact, string type = GraphEdgeTypes.DependsOn,
        string? source = "first", Guid? declaration = null, string from = Source, string target = Target) => new()
    {
        FromAzureResourceId = from, ToAzureResourceId = target, RelationshipType = type,
        ProvenanceKind = provenance, InferenceSource = source, DeclaredConnectionId = declaration,
    };

    private static AzureInventoryResourceRecord Resource(string id, int ordinal) => new()
    {
        ResourceRowId = Guid.Parse($"00000000-0000-0000-0000-{ordinal:D12}"), AzureResourceId = id,
        ResourceType = "Microsoft.Storage/storageAccounts", ResourceGroup = "rg", SubscriptionId = "sub",
    };
}
