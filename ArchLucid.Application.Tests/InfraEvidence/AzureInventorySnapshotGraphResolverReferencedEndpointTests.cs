using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphResolverReferencedEndpointTests
{
    private const string VisibleId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a";
    private const string MissingId = "/subscriptions/remote/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage-a";

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Missing_endpoint_preserves_edge_direction_and_evidence(bool missingSource)
    {
        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot();
        snapshot = WithRelationships(snapshot, missingSource ? MissingId : VisibleId, missingSource ? VisibleId : MissingId);
        var graph = (await ResolveAsync(snapshot)).Graph!;

        var placeholder = graph.Nodes.Single(node => string.Equals(node.SourceId, MissingId, StringComparison.OrdinalIgnoreCase));
        placeholder.Properties["inventory.collectionStatus"].Should().Be("referenced-not-collected");
        placeholder.Properties["arm.type"].Should().Be("microsoft.storage/storageaccounts");
        placeholder.Label.Should().Contain("Referenced; details not collected");
        var edge = graph.Edges.Single(candidate => candidate.InferenceSource == "captured-reference");
        edge.ProvenanceKind.Should().Be(nameof(ProvenanceKind.ObservedFact));
        (missingSource ? edge.FromNodeId : edge.ToNodeId).Should().Be(placeholder.NodeId);
    }

    [Fact]
    public async Task Case_and_trailing_slash_references_reuse_stable_placeholder_and_edge()
    {
        AzureInventorySnapshotDetailReadModel snapshot = WithRelationships(CreateSnapshot(), VisibleId, MissingId);
        AzureInventorySnapshotDetailReadModel duplicate = new()
        {
            Header = snapshot.Header,
            Resources = snapshot.Resources,
            Relationships = [.. snapshot.Relationships, Relationship(VisibleId, MissingId.ToUpperInvariant() + "/")],
        };
        var first = (await ResolveAsync(snapshot)).Graph!;
        var second = (await ResolveAsync(duplicate)).Graph!;
        second.Nodes.Should().ContainSingle(node => string.Equals(node.SourceId, MissingId, StringComparison.OrdinalIgnoreCase));
        second.Nodes.Single(node => string.Equals(node.SourceId, MissingId, StringComparison.OrdinalIgnoreCase)).NodeId.Should().Be(first.Nodes.Single(node => string.Equals(node.SourceId, MissingId, StringComparison.OrdinalIgnoreCase)).NodeId);
        second.Edges.Should().ContainSingle(edge => edge.InferenceSource == "captured-reference");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Hidden_endpoint_is_not_reintroduced_as_placeholder(bool collected)
    {
        const string hiddenId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity-a";
        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot();
        snapshot = new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header,
            Resources = collected ? [.. snapshot.Resources, Resource(hiddenId, "Microsoft.ManagedIdentity/userAssignedIdentities")] : snapshot.Resources,
            Relationships = [Relationship(VisibleId, hiddenId)],
        };
        var graph = (await ResolveAsync(snapshot)).Graph!;
        graph.Nodes.Should().NotContain(node => string.Equals(node.SourceId, hiddenId, StringComparison.OrdinalIgnoreCase));
        graph.Edges.Should().NotContain(edge => edge.InferenceSource == "captured-reference");
        var inclusive = (await ResolveAsync(snapshot, includeHidden: true)).Graph!;
        inclusive.Nodes.Should().ContainSingle(node => string.Equals(node.SourceId, hiddenId, StringComparison.OrdinalIgnoreCase));
        inclusive.Edges.Should().ContainSingle(edge => edge.InferenceSource == "captured-reference");
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-arm-id")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts")]
    public async Task Invalid_reference_does_not_create_resource_node(string invalidId)
    {
        var graph = (await ResolveAsync(WithRelationships(CreateSnapshot(), VisibleId, invalidId))).Graph!;
        graph.Nodes.Should().NotContain(node => node.Properties.ContainsKey("inventory.collectionStatus"));
    }

    [Fact]
    public async Task Missing_nested_child_uses_existing_parent_without_placeholder()
    {
        const string vnetId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot();
        snapshot = new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header,
            Resources = [.. snapshot.Resources, Resource(vnetId, "Microsoft.Network/virtualNetworks")],
            Relationships = [Relationship(VisibleId, vnetId + "/subnets/subnet-a")],
        };
        var graph = (await ResolveAsync(snapshot)).Graph!;
        graph.Nodes.Should().NotContain(node => node.Properties.ContainsKey("inventory.collectionStatus"));
        graph.Edges.Should().Contain(edge => edge.InferenceSource == "captured-reference" && edge.ToNodeId == graph.Nodes.Single(node => node.SourceId == vnetId).NodeId);
    }

    [Fact]
    public async Task Both_uncollected_endpoints_remain_distinct_and_render_uncertainty()
    {
        string otherId = MissingId.Replace("storage-a", "storage_a", StringComparison.Ordinal);
        var graph = (await ResolveAsync(WithRelationships(CreateSnapshot(), MissingId, otherId))).Graph!;
        graph.Nodes.Where(node => node.Properties.ContainsKey("inventory.collectionStatus"))
            .Select(node => node.NodeId).Should().OnlyHaveUniqueItems().And.HaveCount(2);
        graph.Edges.Should().ContainSingle(edge => edge.InferenceSource == "captured-reference");
        var ast = new DiagramAstFromGraphCompiler().Compile(graph, DiagramMode.FullSubscription);
        ast.Nodes.Should().Contain(node => node.Label.Contains("Referenced; details not collected", StringComparison.Ordinal));
    }

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot() => new()
    {
        Header = new AzureInventorySnapshotRecord { SnapshotId = Guid.NewGuid(), TenantId = Guid.NewGuid() },
        Resources = [Resource(VisibleId, "Microsoft.Network/privateEndpoints")],
    };

    private static AzureInventoryResourceRecord Resource(string id, string type) => new()
    {
        ResourceRowId = Guid.NewGuid(), AzureResourceId = id, ResourceType = type,
    };

    private static AzureInventoryResourceRelationshipReadModel Relationship(string from, string to) => new()
    {
        FromAzureResourceId = from, ToAzureResourceId = to, RelationshipType = GraphEdgeTypes.DependsOn,
        InferenceSource = "captured-reference", ProvenanceKind = ProvenanceKind.ObservedFact,
    };

    private static AzureInventorySnapshotDetailReadModel WithRelationships(AzureInventorySnapshotDetailReadModel snapshot, string from, string to) => new()
    {
        Header = snapshot.Header, Resources = snapshot.Resources, Relationships = [Relationship(from, to)],
    };

    private static Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(AzureInventorySnapshotDetailReadModel snapshot, bool includeHidden = false)
    {
        ScopeContext scope = new() { TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(scope, snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        return new AzureInventorySnapshotGraphResolver(repository.Object).TryResolveGraphAsync(scope, snapshot.Header.SnapshotId, includeNeverShowArmTypes: includeHidden);
    }
}
