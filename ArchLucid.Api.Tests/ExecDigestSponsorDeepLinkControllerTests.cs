using ArchLucid.Api.Controllers.Notifications;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.ExecDigest;
using ArchLucid.Contracts.Notifications;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExecDigestSponsorDeepLinkControllerTests
{
    [Fact]
    public async Task GetSponsorViewAsync_missing_token_returns_400()
    {
        ExecDigestSponsorDeepLinkController controller = CreateController(Mock.Of<IExecDigestSponsorDeepLinkReadService>());

        IActionResult action = await controller.GetSponsorViewAsync(null, null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetSponsorViewAsync_invalid_token_returns_404()
    {
        Mock<IExecDigestSponsorDeepLinkReadService> readService = new();
        readService
            .Setup(s => s.TryLoadViewAsync("bad-token", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExecDigestSponsorDeepLinkViewResponse?)null);

        ExecDigestSponsorDeepLinkController controller = CreateController(readService.Object);

        IActionResult action = await controller.GetSponsorViewAsync("bad-token", null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetSponsorViewAsync_valid_token_returns_payload()
    {
        ExecDigestSponsorDeepLinkViewResponse response = new()
        {
            Target = "dashboard",
            WeekLabel = "2026-08-10–2026-08-16 UTC (ISO week 2026-W33)",
            SignInUrl = "https://app.example.com/auth/sign-in",
        };

        Mock<IExecDigestSponsorDeepLinkReadService> readService = new();
        readService
            .Setup(s => s.TryLoadViewAsync("signed-token", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        ExecDigestSponsorDeepLinkController controller = CreateController(readService.Object);

        IActionResult action = await controller.GetSponsorViewAsync("signed-token", null, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<ExecDigestSponsorDeepLinkViewResponse>();
    }

    private static ExecDigestSponsorDeepLinkController CreateController(IExecDigestSponsorDeepLinkReadService readService) =>
        new(readService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
