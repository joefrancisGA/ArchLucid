using ArchLucid.Api.Http;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for <see cref="TenantWorkspaceScopePreflight" /> covering both workspace-existence paths:
///     <list type="number">
///         <item>
///             <see cref="IWorkspaceQueryTenantRepository.WorkspaceExistsAsync" /> capability interface — exercised by
///             mocking <see cref="ITenantRepository" /> and adding <see cref="IWorkspaceQueryTenantRepository" /> via
///             Moq's <c>As&lt;T&gt;()</c>.
///         </item>
///         <item><see cref="ITenantWorkspaceRepository.ListWorkspacesAsync" /> fallback — base interface only.</item>
///     </list>
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWorkspaceScopePreflightTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid OtherWorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly ScopeContext Scope = new()
    {
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd")
    };

    // ── capability-interface (fast path) ────────────────────────────────────────

    [Fact]
    public async Task WorkspaceExistsAsync_uses_capability_interface_when_available_and_returns_true()
    {
        (Mock<ITenantRepository> repoMock, Mock<IWorkspaceQueryTenantRepository> capabilityMock) =
            CreateCapabilityRepositoryMock(workspaceExists: true);

        bool result = await TenantWorkspaceScopePreflight.WorkspaceExistsAsync(
            repoMock.Object, TenantId, WorkspaceId, CancellationToken.None);

        result.Should().BeTrue();
        capabilityMock.Verify(
            c => c.WorkspaceExistsAsync(TenantId, WorkspaceId, It.IsAny<CancellationToken>()),
            Times.Once);
        repoMock.Verify(
            r => r.ListWorkspacesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "capability interface must short-circuit the fallback");
    }

    [Fact]
    public async Task WorkspaceExistsAsync_uses_capability_interface_when_available_and_returns_false()
    {
        (Mock<ITenantRepository> repoMock, Mock<IWorkspaceQueryTenantRepository> capabilityMock) =
            CreateCapabilityRepositoryMock(workspaceExists: false);

        bool result = await TenantWorkspaceScopePreflight.WorkspaceExistsAsync(
            repoMock.Object, TenantId, OtherWorkspaceId, CancellationToken.None);

        result.Should().BeFalse();
        capabilityMock.Verify(
            c => c.WorkspaceExistsAsync(TenantId, OtherWorkspaceId, It.IsAny<CancellationToken>()),
            Times.Once);
        repoMock.Verify(
            r => r.ListWorkspacesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ── list-workspaces fallback path ───────────────────────────────────────────

    [Fact]
    public async Task WorkspaceExistsAsync_falls_back_to_ListWorkspacesAsync_when_capability_absent_and_workspace_found()
    {
        Mock<ITenantRepository> repo = CreateBaseRepositoryMock(
            new TenantWorkspaceListItem { WorkspaceId = WorkspaceId, TenantId = TenantId, Name = "w" });

        bool result = await TenantWorkspaceScopePreflight.WorkspaceExistsAsync(
            repo.Object, TenantId, WorkspaceId, CancellationToken.None);

        result.Should().BeTrue();
        repo.Verify(r => r.ListWorkspacesAsync(TenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task WorkspaceExistsAsync_falls_back_to_ListWorkspacesAsync_when_capability_absent_and_workspace_not_found()
    {
        Mock<ITenantRepository> repo = CreateBaseRepositoryMock(
            new TenantWorkspaceListItem { WorkspaceId = OtherWorkspaceId, TenantId = TenantId, Name = "other" });

        bool result = await TenantWorkspaceScopePreflight.WorkspaceExistsAsync(
            repo.Object, TenantId, WorkspaceId, CancellationToken.None);

        result.Should().BeFalse();
    }

    // ── RequireTenantAndWorkspaceAsync integration ──────────────────────────────

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_404_when_tenant_missing()
    {
        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(TenantId, It.IsAny<CancellationToken>())).ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ControllerBase controller = CreateController();

        (IActionResult? problem, _) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller, scopeProvider.Object, repo.Object, CancellationToken.None);

        ObjectResult result = problem.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_404_when_workspace_missing()
    {
        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = TenantId, Name = "t" });
        repo.Setup(r => r.ListWorkspacesAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem>().AsReadOnly());

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ControllerBase controller = CreateController();

        (IActionResult? problem, _) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller, scopeProvider.Object, repo.Object, CancellationToken.None);

        ObjectResult result = problem.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_null_problem_when_tenant_and_workspace_exist_via_capability()
    {
        (Mock<ITenantRepository> repoMock, _) = CreateCapabilityRepositoryMock(workspaceExists: true);
        repoMock.Setup(r => r.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = TenantId, Name = "t" });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ControllerBase controller = CreateController();

        (IActionResult? problem, ScopeContext scope) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller, scopeProvider.Object, repoMock.Object, CancellationToken.None);

        problem.Should().BeNull();
        scope.TenantId.Should().Be(TenantId);
        repoMock.Verify(
            r => r.ListWorkspacesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ── helpers ─────────────────────────────────────────────────────────────────

    /// <summary>
    ///     Creates a mock <see cref="ITenantRepository" /> that also implements
    ///     <see cref="IWorkspaceQueryTenantRepository" /> (capability fast path).
    /// </summary>
    private static (Mock<ITenantRepository> RepoMock, Mock<IWorkspaceQueryTenantRepository> CapabilityMock)
        CreateCapabilityRepositoryMock(bool workspaceExists)
    {
        Mock<ITenantRepository> repoMock = new();
        Mock<IWorkspaceQueryTenantRepository> capabilityMock = repoMock.As<IWorkspaceQueryTenantRepository>();
        capabilityMock
            .Setup(c => c.WorkspaceExistsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(workspaceExists);
        return (repoMock, capabilityMock);
    }

    private static Mock<ITenantRepository> CreateBaseRepositoryMock(TenantWorkspaceListItem workspace)
    {
        Mock<ITenantRepository> mock = new();
        mock.Setup(r => r.ListWorkspacesAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());
        return mock;
    }

    private static ControllerBase CreateController()
        => new FakeController { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };

    private sealed class FakeController : ControllerBase { }
}

