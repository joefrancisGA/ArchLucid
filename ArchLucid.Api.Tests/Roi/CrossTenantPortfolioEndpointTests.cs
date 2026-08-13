using System.Security.Claims;

using ArchLucid.Api.Controllers.Roi;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace ArchLucid.Api.Tests.Roi;

/// <summary>HTTP surface for <c>GET /v1/roi/cross-tenant-portfolio</c> configuration errors (TB-249).</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CrossTenantPortfolioEndpointTests
{
    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_without_directory_object_key_returns_problem_details_403()
    {
        RoiController sut = new(
            Mock.Of<ISponsorRoiSummaryService>(),
            Mock.Of<ISponsorRoiBoardPackExporter>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IScopeContextProvider>());

        DefaultHttpContext httpContext = new();
        httpContext.Request.Path = "/v1/roi/cross-tenant-portfolio";
        ClaimsIdentity identity = new("test");
        identity.AddClaim(new Claim(ClaimTypes.Name, "operator@test"));
        httpContext.User = new ClaimsPrincipal(identity);

        sut.ControllerContext = new ControllerContext { HttpContext = httpContext };

        ActionResult<CrossTenantPortfolioSummaryResponse> action =
            await sut.GetCrossTenantPortfolioSummaryAsync(CancellationToken.None);

        ObjectResult result = action.Result.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(StatusCodes.Status403Forbidden);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            result.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;

        problem.Title.Should().Be("Portfolio directory key not configured");
        problem.Detail.Should().Contain("portfolio directory object key");
        problem.Type.Should().Be("https://archlucid.net/errors/portfolio-key-not-configured");
    }
}
