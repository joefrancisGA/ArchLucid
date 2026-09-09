using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventoryBindingServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid SnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid ForeignSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

    [Fact]
    public async Task AttachAsync_foreignSnapshotId_returnsSnapshotNotFound()
    {
        ArchitectureInventoryBindingService sut = CreateSut(
            architectureExists: true,
            snapshot: null);

        ArchitectureInventoryBindingAttachResult result = await sut.AttachAsync(
            Scope,
            ArchitectureId,
            ForeignSnapshotId,
            "actor@example.com",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureInventoryBindingAttachStatus.SnapshotNotFound);
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task AttachAsync_sameScopeSnapshot_returnsSuccess()
    {
        AzureInventorySnapshotRecord snapshot = new()
        {
            SnapshotId = SnapshotId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            CapturedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            SubscriptionName = "Prod",
        };

        ArchitectureInventoryBindingService sut = CreateSut(
            architectureExists: true,
            snapshot: snapshot);

        ArchitectureInventoryBindingAttachResult result = await sut.AttachAsync(
            Scope,
            ArchitectureId,
            SnapshotId,
            "actor@example.com",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureInventoryBindingAttachStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.IsBound.Should().BeTrue();
        result.Response.SnapshotId.Should().Be(SnapshotId);
        result.Response.SnapshotCapturedUtc.Should().Be(snapshot.CapturedUtc);
    }

    [Fact]
    public async Task AttachAsync_missingArchitecture_returnsArchitectureNotFound()
    {
        ArchitectureInventoryBindingService sut = CreateSut(
            architectureExists: false,
            snapshot: null);

        ArchitectureInventoryBindingAttachResult result = await sut.AttachAsync(
            Scope,
            ArchitectureId,
            SnapshotId,
            "actor@example.com",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureInventoryBindingAttachStatus.ArchitectureNotFound);
    }

    private static ArchitectureInventoryBindingService CreateSut(
        bool architectureExists,
        AzureInventorySnapshotRecord? snapshot)
    {
        Mock<IArchitectureIdentityRepository> identityRepository = new();
        identityRepository
            .Setup(repository => repository.GetByIdAsync(
                Scope,
                ArchitectureId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(architectureExists
                ? new ArchitectureIdentityRecord { ArchitectureId = ArchitectureId }
                : null);

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetBySnapshotIdAsync(
                Scope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<IArchitectureInventoryBindingRepository> bindingRepository = new();
        bindingRepository
            .Setup(repository => repository.UpsertAsync(
                It.IsAny<ArchitectureInventoryBindingRecord>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new ArchitectureInventoryBindingService(
            identityRepository.Object,
            snapshotRepository.Object,
            bindingRepository.Object);
    }
}
