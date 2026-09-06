using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

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
            await service.ListChangesForDiffAsync(Scope, DiffId, 1, 50, cloudResourceId: null, CancellationToken.None);

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
            await service.ListChangesForDiffAsync(Scope, DiffId, 1, 50, CloudResourceId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.Items.Should().ContainSingle();
        response.Items[0].CloudResourceId.Should().Be(CloudResourceId);
    }

    private static InfraEvidenceDriftWorkbenchQueryService CreateService(
        IAzureInventorySnapshotRepository? snapshotRepository = null,
        IAzureInventoryDiffRepository? diffRepository = null) =>
        new(
            snapshotRepository ?? new Mock<IAzureInventorySnapshotRepository>().Object,
            diffRepository ?? new Mock<IAzureInventoryDiffRepository>().Object);
}
