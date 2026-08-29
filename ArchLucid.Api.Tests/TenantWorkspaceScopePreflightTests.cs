using ArchLucid.Api.Http;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWorkspaceScopePreflightTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_null_when_tenant_and_workspace_exist()
    {
        TestController controller = new();
        Mock<IScopeContextProvider> scopeProvider = CreateScopeProvider();
        ITenantRepository tenantRepository = TenantWithPrimaryWorkspaceRepository();

        IActionResult? result = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller,
            scopeProvider.Object,
            tenantRepository,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_not_found_when_tenant_missing()
    {
        TestController controller = new();
        Mock<IScopeContextProvider> scopeProvider = CreateScopeProvider();
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        IActionResult? result = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller,
            scopeProvider.Object,
            tenants.Object,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        tenants.Verify(
            repository => repository.ListWorkspacesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_not_found_when_workspace_missing()
    {
        TestController controller = new();
        Mock<IScopeContextProvider> scopeProvider = CreateScopeProvider();
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    Name = "other",
                },
            ]);

        IActionResult? result = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller,
            scopeProvider.Object,
            tenants.Object,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_throws_when_controller_null()
    {
        Mock<IScopeContextProvider> scopeProvider = CreateScopeProvider();

        Func<Task> act = () => TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            null!,
            scopeProvider.Object,
            TenantWithPrimaryWorkspaceRepository(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_throws_when_scope_provider_null()
    {
        TestController controller = new();

        Func<Task> act = () => TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller,
            null!,
            TenantWithPrimaryWorkspaceRepository(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_throws_when_tenant_repository_null()
    {
        TestController controller = new();
        Mock<IScopeContextProvider> scopeProvider = CreateScopeProvider();

        Func<Task> act = () => TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            controller,
            scopeProvider.Object,
            null!,
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    private static Mock<IScopeContextProvider> CreateScopeProvider()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        return scopeProvider;
    }

    private static ITenantRepository TenantWithPrimaryWorkspaceRepository()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return tenants.Object;
    }

    private sealed class TestController : ControllerBase
    {
        public TestController()
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        }
    }
}
