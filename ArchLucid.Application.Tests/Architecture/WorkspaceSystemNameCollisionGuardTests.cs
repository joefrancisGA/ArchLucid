using ArchLucid.Application;
using ArchLucid.Application.Architecture;
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
    public async Task EnsureAvailableAsync_throws_when_active_run_exists()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(Scope, "Claims API", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        WorkspaceSystemNameCollisionGuard sut = new(runs.Object, Mock.Of<IDraftRequestRepository>());

        Func<Task> act = async () =>
            await sut.EnsureAvailableAsync(Scope, "Claims API", cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*Claims API*already exists*");
    }

    [Fact]
    public async Task EnsureAvailableAsync_throws_when_mutable_draft_exists()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(Scope, "Payments Hub", It.IsAny<CancellationToken>()))
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
            await sut.EnsureAvailableAsync(Scope, "Payments Hub", cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task EnsureAvailableAsync_succeeds_when_name_is_available()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(Scope, "New System", It.IsAny<CancellationToken>()))
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

        await sut.EnsureAvailableAsync(Scope, "New System", cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task EnsureAvailableAsync_passes_exclude_draft_id_to_repository()
    {
        Guid excludeDraftId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsActiveRunWithSystemNameInWorkspaceAsync(Scope, "Rename Me", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

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

        await sut.EnsureAvailableAsync(Scope, "Rename Me", excludeDraftId, CancellationToken.None);

        drafts.Verify(
            d => d.ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                "Rename Me",
                excludeDraftId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
