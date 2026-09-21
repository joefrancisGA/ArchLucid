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
            .Setup(candidate => candidate.TryGetSnapshotDetailAsync(
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
