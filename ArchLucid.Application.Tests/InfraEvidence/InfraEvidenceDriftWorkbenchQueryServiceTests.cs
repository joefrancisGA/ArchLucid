using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InfraEvidenceDriftWorkbenchQueryServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid DiffId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CloudResourceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public async Task ListChangesForDiffAsync_without_filter_uses_unscoped_paged_query()
    {
        AzureInventoryDiffSummaryRecord diff = new() { DiffId = DiffId, SnapshotAId = Guid.NewGuid(), SnapshotBId = Guid.NewGuid() };

        Mock<IAzureInventoryDiffRepository> diffRepository = new();
        diffRepository
            .Setup(repo => repo.TryGetByDiffIdAsync(Scope, DiffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(diff);
        diffRepository
            .Setup(repo => repo.ListChangesByDiffIdPagedAsync(
                Scope,
                DiffId,
                1,
                50,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], 0));

        InfraEvidenceDriftWorkbenchQueryService service = CreateService(diffRepository: diffRepository.Object);

        PagedResponse<AzureInventoryChangeRecord>? response =
            await service.ListChangesForDiffAsync(
                Scope,
                DiffId,
                1,
                50,
                cloudResourceId: null,
                includeUnchanged: false,
                CancellationToken.None);

        response.Should().NotBeNull();
        diffRepository.Verify(
            repo => repo.ListChangesByDiffIdPagedAsync(
                Scope,
                DiffId,
                1,
                50,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListChangesForDiffAsync_with_includeUnchanged_merges_unchanged_resources()
    {
        Guid snapshotAId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid snapshotBId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string unchangedArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string changedArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        AzureInventoryDiffSummaryRecord diff = new()
        {
            DiffId = DiffId,
            SnapshotAId = snapshotAId,
            SnapshotBId = snapshotBId,
        };

        AzureInventoryChangeRecord changed = new()
        {
            ChangeId = Guid.NewGuid(),
            DiffId = DiffId,
            SnapshotAId = snapshotAId,
            SnapshotBId = snapshotBId,
            AzureResourceId = changedArmId,
            ChangeType = AzureInventoryChangeType.ResourceModified,
            Property = "sku",
        };

        AzureInventorySnapshotDetailReadModel snapshotDetail = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotAId,
                TenantId = Scope.TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = snapshotAId,
                    TenantId = Scope.TenantId,
                    AzureResourceId = unchangedArmId,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = snapshotAId,
                    TenantId = Scope.TenantId,
                    AzureResourceId = changedArmId,
                    ResourceType = "Microsoft.Compute/virtualMachines",
                },
            ],
        };

        Mock<IAzureInventoryDiffRepository> diffRepository = new();
        diffRepository
            .Setup(repo => repo.TryGetByDiffIdAsync(Scope, DiffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(diff);
        diffRepository
            .Setup(repo => repo.ListChangesByDiffIdAsync(Scope, DiffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([changed]);

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repo => repo.TryGetSnapshotDetailAsync(Scope, snapshotAId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshotDetail);
        snapshotRepository
            .Setup(repo => repo.TryGetSnapshotDetailAsync(Scope, snapshotBId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshotDetail);

        InfraEvidenceDriftWorkbenchQueryService service = CreateService(
            snapshotRepository: snapshotRepository.Object,
            diffRepository: diffRepository.Object);

        PagedResponse<AzureInventoryChangeRecord>? response =
            await service.ListChangesForDiffAsync(
                Scope,
                DiffId,
                1,
                50,
                cloudResourceId: null,
                includeUnchanged: true,
                CancellationToken.None);

        response.Should().NotBeNull();
        response!.Items.Should().HaveCount(2);
        response.Items.Should().Contain(item => item.ChangeType == AzureInventoryChangeType.ResourceUnchanged);
        response.Items.Should().Contain(item => item.ChangeType == AzureInventoryChangeType.ResourceModified);
        diffRepository.Verify(
            repo => repo.ListChangesByDiffIdPagedAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListChangesForDiffAsync_with_cloudResourceId_passes_scope_to_repository()
    {
        AzureInventoryDiffSummaryRecord diff = new() { DiffId = DiffId, SnapshotAId = Guid.NewGuid(), SnapshotBId = Guid.NewGuid() };
        AzureInventoryChangeRecord change = new()
        {
            ChangeId = Guid.NewGuid(),
            DiffId = DiffId,
            SnapshotAId = diff.SnapshotAId,
            SnapshotBId = diff.SnapshotBId,
            CloudResourceId = CloudResourceId,
            AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
            ChangeType = AzureInventoryChangeType.ResourceModified,
            Property = "sku",
        };

        Mock<IAzureInventoryDiffRepository> diffRepository = new();
        diffRepository
            .Setup(repo => repo.TryGetByDiffIdAsync(Scope, DiffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(diff);
        diffRepository
            .Setup(repo => repo.ListChangesByDiffIdPagedAsync(
                Scope,
                DiffId,
                1,
                50,
                CloudResourceId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(([change], 1));

        InfraEvidenceDriftWorkbenchQueryService service = CreateService(diffRepository: diffRepository.Object);

        PagedResponse<AzureInventoryChangeRecord>? response =
            await service.ListChangesForDiffAsync(
                Scope,
                DiffId,
                1,
                50,
                CloudResourceId,
                includeUnchanged: false,
                CancellationToken.None);

        response.Should().NotBeNull();
        response!.Items.Should().ContainSingle();
        response.Items[0].CloudResourceId.Should().Be(CloudResourceId);
    }

    private static InfraEvidenceDriftWorkbenchQueryService CreateService(
        IAzureInventorySnapshotRepository? snapshotRepository = null,
        IAzureInventoryDiffRepository? diffRepository = null)
    {
        Mock<IArchitectureDiagramReconciliationRepository> reconciliation = new();
        reconciliation
            .Setup(repo => repo.ListRunIdsBySnapshotAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<Guid>());

        return new InfraEvidenceDriftWorkbenchQueryService(
            snapshotRepository ?? new Mock<IAzureInventorySnapshotRepository>().Object,
            diffRepository ?? new Mock<IAzureInventoryDiffRepository>().Object,
            reconciliation.Object,
            new Mock<IAuthorityQueryService>().Object,
            new Mock<IManifestHashService>().Object);
    }
}
