using System.Reflection;
using ArchLucid.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RuntimeFindingHistoryControllerTests
{
    [Fact]
    public void Endpoint_requires_authentication_and_disables_caching()
    {
        Assert.NotNull(typeof(RuntimeFindingHistoryController).GetCustomAttribute<AuthorizeAttribute>());
        var method = typeof(RuntimeFindingHistoryController).GetMethod(nameof(RuntimeFindingHistoryController.GetAsync))!;
        Assert.True(method.GetCustomAttribute<ResponseCacheAttribute>()!.NoStore);
    }

    [Fact]
    public async Task Invalid_scope_and_anonymous_requests_never_resolve_reader()
    {
        var controller = new RuntimeFindingHistoryController
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
        Assert.IsType<BadRequestResult>(await controller.GetAsync(Guid.Empty, Guid.NewGuid(), Guid.NewGuid(),
            "resource", "generation", "php"));
        Assert.IsType<UnauthorizedResult>(await controller.GetAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "resource", "generation", "php"));
        Assert.IsType<BadRequestResult>(await controller.GetAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "resource", "generation", "php", 21));
    }
}
