using System.Reflection;
using ArchLucid.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using ArchLucid.Host.Core.ProblemDetails;

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
        AssertValidationProblem(await controller.GetAsync(Guid.Empty, Guid.NewGuid(), Guid.NewGuid(),
            "resource", "generation", "php"));
        Assert.IsType<UnauthorizedResult>(await controller.GetAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "resource", "generation", "php"));
        AssertValidationProblem(await controller.GetAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "resource", "generation", "php", 21));
    }

    private static void AssertValidationProblem(IActionResult result)
    {
        ObjectResult response = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, response.StatusCode);
        Assert.Contains("application/problem+json", response.ContentTypes);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = Assert.IsType<Microsoft.AspNetCore.Mvc.ProblemDetails>(response.Value);
        Assert.Equal(ProblemTypes.BadRequest, problem.Type);
    }
}
