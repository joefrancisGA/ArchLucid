using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureInventoryBindingServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ForeignSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Fact]
    public async Task AttachAsync_cross_tenant_snapshot_id_fails_closed_as_snapshot_not_found()
    {
        Mock<IArchitectureIdentityRepository> identities = new();
        identities
            .Setup(repository => repository.GetByIdAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord
            {
                ArchitectureId = ArchitectureId,
                DisplayName = "Platform",
            });

        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots
            .Setup(repository => repository.TryGetBySnapshotIdAsync(Scope, ForeignSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AzureInventorySnapshotRecord?)null);

        Mock<IArchitectureInventoryBindingRepository> bindings = new();

        ArchitectureInventoryBindingService sut = new(
            identities.Object,
            snapshots.Object,
            bindings.Object);

        ArchitectureInventoryBindingAttachResult result = await sut.AttachAsync(
            Scope,
            ArchitectureId,
            ForeignSnapshotId,
            "reviewer@example.com",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureInventoryBindingAttachStatus.SnapshotNotFound);
        bindings.Verify(
            repository => repository.UpsertAsync(It.IsAny<ArchitectureInventoryBindingRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AttachAsync_same_tenant_snapshot_succeeds()
    {
        Mock<IArchitectureIdentityRepository> identities = new();
        identities
            .Setup(repository => repository.GetByIdAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord
            {
                ArchitectureId = ArchitectureId,
                DisplayName = "Platform",
            });

        Guid snapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots
            .Setup(repository => repository.TryGetBySnapshotIdAsync(Scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                CapturedUtc = DateTime.UtcNow,
            });

        Mock<IArchitectureInventoryBindingRepository> bindings = new();
        bindings
            .Setup(repository => repository.UpsertAsync(It.IsAny<ArchitectureInventoryBindingRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureInventoryBindingService sut = new(
            identities.Object,
            snapshots.Object,
            bindings.Object);

        ArchitectureInventoryBindingAttachResult result = await sut.AttachAsync(
            Scope,
            ArchitectureId,
            snapshotId,
            "reviewer@example.com",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureInventoryBindingAttachStatus.Success);
        result.Response!.IsBound.Should().BeTrue();
        result.Response.SnapshotId.Should().Be(snapshotId);

        bindings.Verify(
            repository => repository.UpsertAsync(
                It.Is<ArchitectureInventoryBindingRecord>(record =>
                    record.ArchitectureId == ArchitectureId
                    && record.SnapshotId == snapshotId
                    && record.TenantId == Scope.TenantId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
