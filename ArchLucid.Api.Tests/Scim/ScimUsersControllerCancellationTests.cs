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
}
