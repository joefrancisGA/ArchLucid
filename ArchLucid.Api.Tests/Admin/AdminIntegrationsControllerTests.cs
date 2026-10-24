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
    public async Task RetryIntegrationOutboxDeadLetters_accepts_empty_string_event_type_filter()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.EventType == string.Empty),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { EventType = string.Empty };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_forwards_explicit_max_rows_when_event_type_is_null()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 42 && r.EventType == null),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 42 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_whitespace_only_event_type_filter()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.EventType == "   "),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { EventType = "   " };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_uses_default_max_rows_when_only_event_type_filter_set()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 100 && r.EventType == "webhook.delivery.failed"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { EventType = "webhook.delivery.failed" };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

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
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_2()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 2),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 2 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_99()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 99),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 99 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_100()
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

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 100 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
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
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_491()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 491),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 491 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_492()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 492),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 492 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_493()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 493),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 493 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_494()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 494),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 494 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_495()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 495),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 495 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_496()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 496),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 496 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_497()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 497),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 497 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_498()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 498),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 498 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_499()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 499),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 499 };

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
