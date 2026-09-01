using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WorkspaceSystemNameCollisionGuardTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task EnsureAvailableAsync_throws_when_active_review_exists()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "Claims API",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, Mock.Of<IDraftRequestRepository>());

        Func<Task> act = async () =>
            await sut.EnsureAvailableAsync(
                Scope,
                "Claims API",
                WorkspaceSystemNameOccupancyKind.Review,
                cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*review named 'Claims API'*already exists*");
    }

    [Fact]
    public async Task EnsureAvailableAsync_throws_when_mutable_architecture_exists()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "Payments Hub",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IDraftRequestRepository> drafts = new();
        drafts
            .Setup(d => d.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                "Payments Hub",
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, drafts.Object);

        Func<Task> act = async () =>
            await sut.EnsureAvailableAsync(
                Scope,
                "Payments Hub",
                WorkspaceSystemNameOccupancyKind.Architecture,
                cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*architecture named 'Payments Hub'*already exists*");
    }

    [Fact]
    public async Task EnsureAvailableAsync_succeeds_when_review_name_matches_architecture_only()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "ArchLucid",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IDraftRequestRepository> drafts = new();
        drafts
            .Setup(d => d.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                "ArchLucid",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, drafts.Object);

        await sut.EnsureAvailableAsync(
            Scope,
            "ArchLucid",
            WorkspaceSystemNameOccupancyKind.Review,
            cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task EnsureAvailableAsync_succeeds_when_architecture_name_matches_review_only()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "ArchLucid",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IDraftRequestRepository> drafts = new();
        drafts
            .Setup(d => d.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                "ArchLucid",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, drafts.Object);

        await sut.EnsureAvailableAsync(
            Scope,
            "ArchLucid",
            WorkspaceSystemNameOccupancyKind.Architecture,
            cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task EnsureAvailableAsync_succeeds_when_name_is_available()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "New System",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IDraftRequestRepository> drafts = new();
        drafts
            .Setup(d => d.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                "New System",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, drafts.Object);

        await sut.EnsureAvailableAsync(
            Scope,
            "New System",
            WorkspaceSystemNameOccupancyKind.Review,
            cancellationToken: CancellationToken.None);
        await sut.EnsureAvailableAsync(
            Scope,
            "New System",
            WorkspaceSystemNameOccupancyKind.Architecture,
            cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task EnsureAvailableAsync_passes_exclude_draft_id_to_repository()
    {
        Guid excludeDraftId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();

        Mock<IDraftRequestRepository> drafts = new();
        drafts
            .Setup(d => d.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                "Rename Me",
                excludeDraftId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, drafts.Object);

        await sut.EnsureAvailableAsync(
            Scope,
            "Rename Me",
            WorkspaceSystemNameOccupancyKind.Architecture,
            excludeDraftId: excludeDraftId,
            cancellationToken: CancellationToken.None);

        drafts.Verify(
            d => d.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                "Rename Me",
                excludeDraftId,
                It.IsAny<CancellationToken>()),
            Times.Once);
        runs.Verify(
            r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EnsureAvailableAsync_passes_exclude_run_id_to_repository()
    {
        Guid excludeRunId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "Payments Hub",
                excludeRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, Mock.Of<IDraftRequestRepository>());

        await sut.EnsureAvailableAsync(
            Scope,
            "Payments Hub",
            WorkspaceSystemNameOccupancyKind.Review,
            excludeRunId: excludeRunId,
            cancellationToken: CancellationToken.None);

        runs.Verify(
            r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "Payments Hub",
                excludeRunId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task IsAvailableAsync_returns_false_when_active_review_exists()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(
                Scope,
                "Claims API",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, Mock.Of<IDraftRequestRepository>());

        bool available = await sut.IsAvailableAsync(
            Scope,
            "Claims API",
            WorkspaceSystemNameOccupancyKind.Review,
            cancellationToken: CancellationToken.None);

        available.Should().BeFalse();
    }

    [Fact]
    public async Task IsAvailableAsync_returns_true_when_name_is_empty_after_trim()
    {
        WorkspaceSystemNameCollisionGuard sut = new(Mock.Of<IRunRepository>(), Mock.Of<IDraftRequestRepository>());

        bool available = await sut.IsAvailableAsync(
            Scope,
            "   ",
            WorkspaceSystemNameOccupancyKind.Review,
            cancellationToken: CancellationToken.None);

        available.Should().BeTrue();
    }
}
