using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class AdminIntegrationsControllerTests
{
    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_uses_default_max_rows_when_body_is_empty_object()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 100),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(
            new IntegrationOutboxDeadLetterBulkRetryRequest(),
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_uses_default_max_rows_when_body_is_null()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 100),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(null, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_returns_bad_request_when_max_rows_is_zero()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 0 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        diagnostics.Verify(
            static d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.IsAny<IntegrationOutboxDeadLetterBulkRetryRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_returns_bad_request_when_max_rows_exceeds_500()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 501 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        diagnostics.Verify(
            static d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.IsAny<IntegrationOutboxDeadLetterBulkRetryRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_at_lower_bound_1()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 1),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 1 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_at_upper_bound_500()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 500),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 500 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_returns_bad_request_when_max_rows_is_negative()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = -1 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        diagnostics.Verify(
            static d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.IsAny<IntegrationOutboxDeadLetterBulkRetryRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
