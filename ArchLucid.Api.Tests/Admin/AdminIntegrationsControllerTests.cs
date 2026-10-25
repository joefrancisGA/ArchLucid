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
