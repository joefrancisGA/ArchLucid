using ArchLucid.Api.Controllers.Notifications;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExecDigestUnsubscribeControllerTests
{
    [Fact]
    public async Task UnsubscribeAsync_missing_token_returns_400()
    {
        ExecDigestUnsubscribeController controller = CreateController(
            Mock.Of<IExecDigestUnsubscribeTokenFactory>(),
            Mock.Of<ITenantExecDigestPreferencesRepository>());

        IActionResult action = await controller.UnsubscribeAsync(token: null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task UnsubscribeAsync_invalid_token_returns_400()
    {
        Guid ignoredTenantId = Guid.Empty;
        Mock<IExecDigestUnsubscribeTokenFactory> tokenFactory = new();
        tokenFactory
            .Setup(f => f.TryParseTenant("bad-token", out ignoredTenantId))
            .Returns(false);

        ExecDigestUnsubscribeController controller = CreateController(
            tokenFactory.Object,
            Mock.Of<ITenantExecDigestPreferencesRepository>());

        IActionResult action = await controller.UnsubscribeAsync("bad-token", CancellationToken.None);

        action.Should().BeOfType<ObjectResult>();
    }

    [Fact]
    public async Task UnsubscribeAsync_valid_token_disables_email_and_returns_plain_text()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IExecDigestUnsubscribeTokenFactory> tokenFactory = new();
        tokenFactory
            .Setup(f => f.TryParseTenant("signed-token", out tenantId))
            .Returns(true);

        Mock<ITenantExecDigestPreferencesRepository> preferences = new();
        preferences
            .Setup(r => r.TryDisableEmailAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        ExecDigestUnsubscribeController controller = CreateController(tokenFactory.Object, preferences.Object);

        IActionResult action = await controller.UnsubscribeAsync("signed-token", CancellationToken.None);

        ContentResult content = action.Should().BeOfType<ContentResult>().Subject;
        content.ContentType.Should().Be("text/plain; charset=utf-8");
        content.Content.Should().Contain("turned off");

        preferences.Verify(
            r => r.TryDisableEmailAsync(tenantId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ExecDigestUnsubscribeController CreateController(
        IExecDigestUnsubscribeTokenFactory tokenFactory,
        ITenantExecDigestPreferencesRepository preferencesRepository) =>
        new(tokenFactory, preferencesRepository)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
}
