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
