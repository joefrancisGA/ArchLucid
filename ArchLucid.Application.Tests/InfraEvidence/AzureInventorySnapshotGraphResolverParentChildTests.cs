using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphResolverParentChildTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_contains_from_arm_nesting_when_relationship_missing()
    {
        Guid vnetRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid subnetRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/subnets/app";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                CreateResource(subnetRow, subnetArmId, "Microsoft.Network/virtualNetworks/subnets"),
            ],
        };

        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AzureInventorySnapshotGraphResolver resolver = new(repository.Object);

        AzureInventorySnapshotGraphResolveResult result = await resolver.TryResolveGraphAsync(
            new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            SnapshotId,
            cancellationToken: CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().ContainSingle(edge =>
            edge.EdgeType == GraphEdgeTypes.Contains
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryExplicitParentChild);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task TryResolveGraphAsync_reads_canonical_evidence_before_applying_visibility(bool includeHidden)
    {
        const string visibleId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string hiddenId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity-a";
        Guid hiddenRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord { SnapshotId = SnapshotId, TenantId = TenantId },
            Resources =
            [
                CreateResource(Guid.NewGuid(), visibleId, "Microsoft.Network/virtualNetworks"),
                CreateResource(hiddenRowId, hiddenId, "Microsoft.ManagedIdentity/userAssignedIdentities"),
            ],
            Properties = [new AzureInventoryResourcePropertyReadModel { ResourceRowId = hiddenRowId, PropertyKey = "principalId", PropertyValue = "principal-a" }],
            Relationships = [new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = visibleId,
                ToAzureResourceId = hiddenId,
                RelationshipType = GraphEdgeTypes.Contains,
                ProvenanceKind = ProvenanceKind.ObservedFact,
            }],
        };
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<ISecurityDeclaredConnectionRepository> declared = new(MockBehavior.Strict);
        declared.Setup(candidate => candidate.ListActiveByTenantAsync(TenantId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<SecurityDeclaredConnectionRecord>());
        Mock<IOperatorInferredConnectionRepository> inferred = new(MockBehavior.Strict);
        inferred.Setup(candidate => candidate.ListBySnapshotAsync(TenantId, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<OperatorInferredConnectionRecord>());
        DeclaredConnectionEnrichedAzureInventorySnapshotRepository enriched = new(repository.Object, declared.Object, inferred.Object);
        AzureInventorySnapshotGraphResolveResult result = await new AzureInventorySnapshotGraphResolver(enriched)
            .TryResolveGraphAsync(scope, SnapshotId, includeNeverShowArmTypes: includeHidden);

        result.Succeeded.Should().BeTrue();
        result.Snapshot.Should().BeSameAs(snapshot);
        result.Snapshot!.Properties.Should().ContainSingle();
        result.Snapshot.Relationships.Should().ContainSingle();
        result.Graph!.Nodes.Any(node => node.SourceId == hiddenId).Should().Be(includeHidden);
        result.Graph.Nodes.Should().Contain(node => node.SourceId == visibleId);
        result.Graph.Edges.Any(edge => edge.EdgeType == GraphEdgeTypes.Contains).Should().Be(includeHidden);
        repository.VerifyAll();
        declared.VerifyAll();
        inferred.VerifyAll();
    }

    private static AzureInventoryResourceRecord CreateResource(
        Guid resourceRowId,
        string azureResourceId,
        string resourceType)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
