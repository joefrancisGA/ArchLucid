using System.Text.Json;

using ArchLucid.Api.Controllers.Scim;
using ArchLucid.Application.Scim;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Scim;

[Trait("Category", "Unit")]
public sealed class ScimUsersControllerCancellationTests
{
    [SkippableFact]
    public async Task CreateAsync_propagates_operation_canceled_during_json_deserialize()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        DefaultHttpContext httpContext = new();
        httpContext.Request.Body = new MemoryStream("{\"userName\":\"scim@example.com\"}"u8.ToArray());

        ScimUsersController sut = new(Mock.Of<IScimUserService>(), scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        using CancellationTokenSource cts = new();
        cts.Cancel();

        Func<Task> act = () => sut.CreateAsync(cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task CreateAsync_propagates_operation_canceled_from_service_create()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.CreateAsync(tenantId, It.IsAny<JsonElement>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        DefaultHttpContext httpContext = new();
        httpContext.Request.Body = new MemoryStream("{\"userName\":\"scim@example.com\"}"u8.ToArray());

        ScimUsersController sut = new(users.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        Func<Task> act = () => sut.CreateAsync(CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task ReplaceAsync_propagates_operation_canceled_from_service_replace()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid userId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.ReplaceAsync(tenantId, userId, It.IsAny<JsonElement>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        DefaultHttpContext httpContext = new();
        httpContext.Request.Body = new MemoryStream("{\"userName\":\"scim@example.com\"}"u8.ToArray());

        ScimUsersController sut = new(users.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        Func<Task> act = () => sut.ReplaceAsync(userId, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task ReplaceAsync_propagates_operation_canceled_from_post_replace_get()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid userId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.ReplaceAsync(tenantId, userId, It.IsAny<JsonElement>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        users
            .Setup(s => s.GetAsync(tenantId, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        DefaultHttpContext httpContext = new();
        httpContext.Request.Body = new MemoryStream("{\"userName\":\"scim@example.com\"}"u8.ToArray());

        ScimUsersController sut = new(users.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        Func<Task> act = () => sut.ReplaceAsync(userId, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task PatchAsync_propagates_operation_canceled_from_post_patch_get()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid userId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.PatchAsync(tenantId, userId, It.IsAny<JsonElement>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        users
            .Setup(s => s.GetAsync(tenantId, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        DefaultHttpContext httpContext = new();
        httpContext.Request.Body = new MemoryStream("{\"Operations\":[]}"u8.ToArray());

        ScimUsersController sut = new(users.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        Func<Task> act = () => sut.PatchAsync(userId, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task ListAsync_propagates_operation_canceled_from_service_list()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.ListAsync(tenantId, null, 1, 100, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        ScimUsersController sut = new(users.Object, scopeProvider.Object);

        Func<Task> act = () => sut.ListAsync(null, 1, 100, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task CreateAsync_empty_http_body_returns_invalid_syntax_without_calling_service()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();

        DefaultHttpContext httpContext = new();
        httpContext.Request.Body = new MemoryStream([]);

        ScimUsersController sut = new(users.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        IActionResult result = await sut.CreateAsync(CancellationToken.None);

        ContentResult content = result.Should().BeOfType<ContentResult>().Subject;
        content.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        content.Content.Should().Contain("invalidSyntax");

        users.Verify(
            s => s.CreateAsync(It.IsAny<Guid>(), It.IsAny<JsonElement>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PatchAsync_propagates_operation_canceled_from_service_patch()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid userId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.PatchAsync(tenantId, userId, It.IsAny<JsonElement>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        DefaultHttpContext httpContext = new();
        httpContext.Request.Body = new MemoryStream("{\"Operations\":[]}"u8.ToArray());

        ScimUsersController sut = new(users.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        Func<Task> act = () => sut.PatchAsync(userId, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task GetAsync_propagates_operation_canceled_from_service()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid userId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.GetAsync(tenantId, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        ScimUsersController sut = new(users.Object, scopeProvider.Object);

        Func<Task> act = () => sut.GetAsync(userId, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task DeleteAsync_propagates_operation_canceled_during_deactivate()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid userId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<IScimUserService> users = new();
        users
            .Setup(s => s.DeactivateAsync(tenantId, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        ScimUsersController sut = new(users.Object, scopeProvider.Object);

        Func<Task> act = () => sut.DeleteAsync(userId, CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
