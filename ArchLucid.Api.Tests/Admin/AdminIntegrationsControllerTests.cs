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
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_412()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 412),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 412 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_411()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 411),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 411 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_410()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 410),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 410 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_409()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 409),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 409 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_408()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 408),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 408 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_407()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 407),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 407 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_406()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 406),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 406 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_405()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 405),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 405 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_404()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 404),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 404 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_403()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 403),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 403 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_402()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 402),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 402 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_401()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 401),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 401 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_400()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 400),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 400 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_399()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 399),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 399 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_398()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 398),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 398 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_397()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 397),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 397 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_396()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 396),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 396 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_395()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 395),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 395 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_394()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 394),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 394 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_232()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 232),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 232 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_233()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 233),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 233 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_234()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 234),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 234 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_235()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 235),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 235 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_236()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 236),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 236 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_237()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 237),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 237 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_238()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 238),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 238 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_239()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 239),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 239 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_240()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 240),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 240 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_241()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 241),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 241 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_242()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 242),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 242 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_243()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 243),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 243 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_244()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 244),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 244 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_245()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 245),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 245 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_246()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 246),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 246 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_247()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 247),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 247 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_248()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 248),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 248 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_249()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 249),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 249 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_250()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 250),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 250 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_251()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 251),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 251 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_252()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 252),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 252 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_253()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 253),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 253 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_254()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 254),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 254 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_255()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 255),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 255 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_256()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 256),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 256 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_257()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 257),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 257 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_258()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 258),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 258 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_259()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 259),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 259 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_260()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 260),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 260 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_261()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 261),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 261 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_262()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 262),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 262 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_263()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 263),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 263 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_264()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 264),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 264 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_265()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 265),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 265 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_266()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 266),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 266 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_267()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 267),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 267 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_268()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 268),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 268 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_269()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 269),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 269 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_270()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 270),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 270 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_271()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 271),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 271 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_272()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 272),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 272 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_273()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 273),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 273 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_274()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 274),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 274 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_275()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 275),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 275 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_276()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 276),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 276 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_277()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 277),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 277 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_278()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 278),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 278 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_279()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 279),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 279 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_280()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 280),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 280 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_281()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 281),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 281 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_282()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 282),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 282 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_283()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 283),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 283 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_284()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 284),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 284 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_285()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 285),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 285 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_286()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 286),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 286 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_287()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 287),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 287 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_288()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 288),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 288 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_289()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 289),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 289 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_290()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 290),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 290 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_291()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 291),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 291 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_292()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 292),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 292 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_293()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 293),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 293 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_294()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 294),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 294 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_295()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 295),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 295 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_296()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 296),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 296 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_297()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 297),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 297 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_298()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 298),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 298 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_299()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 299),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 299 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_300()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 300),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 300 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_301()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 301),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 301 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_302()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 302),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 302 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_303()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 303),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 303 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_304()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 304),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 304 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_305()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 305),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 305 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_306()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 306),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 306 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_307()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 307),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 307 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_308()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 308),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 308 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_309()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 309),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 309 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_310()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 310),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 310 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_311()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 311),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 311 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_312()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 312),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 312 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_313()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 313),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 313 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_314()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 314),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 314 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_315()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 315),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 315 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_316()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 316),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 316 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_317()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 317),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 317 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_318()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 318),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 318 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_319()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 319),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 319 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_320()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 320),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 320 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_321()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 321),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 321 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_322()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 322),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 322 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_323()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 323),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 323 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_324()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 324),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 324 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_325()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 325),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 325 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_326()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 326),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 326 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_327()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 327),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 327 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_328()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 328),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 328 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_329()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 329),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 329 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_330()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 330),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 330 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_331()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 331),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 331 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_332()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 332),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 332 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_333()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 333),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 333 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_334()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 334),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 334 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_335()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 335),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 335 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_336()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 336),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 336 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_337()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 337),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 337 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_338()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 338),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 338 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_339()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 339),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 339 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_340()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 340),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 340 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_341()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 341),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 341 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_342()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 342),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 342 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_343()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 343),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 343 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_344()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 344),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 344 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_345()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 345),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 345 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_346()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 346),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 346 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_347()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 347),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 347 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_348()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 348),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 348 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_349()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 349),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 349 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_350()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 350),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 350 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_351()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 351),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 351 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_352()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 352),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 352 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_353()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 353),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 353 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_354()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 354),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 354 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_355()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 355),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 355 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_356()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 356),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 356 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_357()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 357),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 357 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_358()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 358),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 358 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_359()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 359),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 359 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_360()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 360),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 360 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_361()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 361),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 361 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_362()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 362),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 362 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_363()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 363),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 363 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_364()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 364),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 364 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_365()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 365),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 365 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_366()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 366),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 366 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_367()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 367),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 367 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_368()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 368),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 368 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_369()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 369),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 369 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_370()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 370),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 370 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_371()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 371),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 371 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_372()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 372),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 372 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_373()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 373),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 373 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_374()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 374),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 374 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_375()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 375),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 375 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_376()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 376),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 376 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_377()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 377),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 377 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_378()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 378),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 378 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_379()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 379),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 379 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_380()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 380),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 380 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_381()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 381),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 381 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_382()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 382),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 382 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_383()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 383),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 383 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_384()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 384),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 384 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_385()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 385),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 385 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_386()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 386),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 386 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_387()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 387),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 387 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_388()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 388),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 388 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_389()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 389),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 389 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_390()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 390),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 390 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_391()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 391),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 391 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_392()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 392),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 392 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_393()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 393),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 393 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_413()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 413),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 413 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_414()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 414),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 414 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_415()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 415),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 415 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_416()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 416),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 416 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_417()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 417),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 417 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_418()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 418),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 418 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_419()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 419),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 419 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_420()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 420),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 420 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_421()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 421),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 421 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_422()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 422),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 422 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_423()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 423),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 423 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_424()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 424),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 424 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_425()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 425),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 425 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_426()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 426),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 426 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_427()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 427),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 427 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_428()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 428),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 428 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_429()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 429),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 429 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_430()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 430),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 430 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_431()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 431),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 431 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_432()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 432),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 432 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_433()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 433),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 433 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_434()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 434),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 434 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_435()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 435),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 435 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_436()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 436),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 436 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_437()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 437),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 437 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_438()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 438),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 438 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_439()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 439),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 439 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_440()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 440),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 440 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_441()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 441),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 441 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_442()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 442),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 442 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_443()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 443),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 443 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_444()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 444),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 444 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_445()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 445),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 445 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_446()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 446),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 446 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_447()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 447),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 447 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_448()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 448),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 448 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_449()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 449),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 449 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_450()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 450),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 450 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_451()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 451),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 451 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_452()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 452),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 452 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_453()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 453),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 453 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_454()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 454),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 454 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_455()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 455),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 455 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_456()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 456),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 456 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_457()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 457),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 457 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_458()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 458),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 458 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_459()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 459),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 459 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_460()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 460),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 460 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_461()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 461),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 461 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_462()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 462),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 462 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_463()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 463),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 463 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_464()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 464),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 464 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_465()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 465),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 465 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_466()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 466),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 466 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_467()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 467),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 467 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_468()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 468),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 468 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_469()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 469),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 469 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_470()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 470),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 470 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_471()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 471),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 471 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_472()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 472),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 472 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_473()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 473),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 473 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_474()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 474),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 474 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_475()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 475),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 475 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_476()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 476),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 476 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_477()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 477),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 477 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_478()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 478),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 478 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_479()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 479),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 479 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_480()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 480),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 480 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_481()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 481),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 481 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_482()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 482),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 482 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_483()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 483),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 483 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_484()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 484),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 484 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_485()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 485),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 485 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_486()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 486),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 486 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_487()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 487),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 487 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_488()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 488),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 488 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_489()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 489),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 489 };

        IActionResult result = await controller.RetryIntegrationOutboxDeadLetters(body, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetters_accepts_max_rows_of_490()
    {
        Mock<IAdminDiagnosticsService> diagnostics = new();
        diagnostics
            .Setup(d => d.RetryIntegrationOutboxDeadLettersAsync(
                It.Is<IntegrationOutboxDeadLetterBulkRetryRequest>(r => r.MaxRows == 490),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResponse());

        AdminIntegrationsController controller = new(diagnostics.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IntegrationOutboxDeadLetterBulkRetryRequest body = new() { MaxRows = 490 };

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
