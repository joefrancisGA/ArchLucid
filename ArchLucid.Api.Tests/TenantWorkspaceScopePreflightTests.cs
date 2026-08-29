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
    public async Task RequireTenantAndWorkspaceAsync_throws_when_controller_null()
    {
        Func<Task> act = () => TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            null!,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantRepository>(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("controller");
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_throws_when_scope_provider_null()
    {
        Func<Task> act = () => TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            new StubController(),
            null!,
            Mock.Of<ITenantRepository>(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("scopeProvider");
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_throws_when_tenant_repository_null()
    {
        Func<Task> act = () => TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            new StubController(),
            Mock.Of<IScopeContextProvider>(),
            null!,
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("tenantRepository");
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_null_when_tenant_and_workspace_exist()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        IActionResult? result = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            new StubController(),
            scopeProvider.Object,
            tenants.Object,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_not_found_when_tenant_missing()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        IActionResult? result = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            new StubController(),
            scopeProvider.Object,
            tenants.Object,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails? problem =
            notFound.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Be("Tenant not found.");
    }

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        IActionResult? result = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            new StubController(),
            scopeProvider.Object,
            tenants.Object,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails? problem =
            notFound.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Be("Workspace was not found for this tenant.");
    }

    private sealed class StubController : ControllerBase
    {
        public StubController()
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        }
    }
}
