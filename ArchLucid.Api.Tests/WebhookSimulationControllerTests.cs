using ArchLucid.Api.Controllers.Integrations;
using ArchLucid.Api.Models;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP surface for <c>POST /v1/integrations/webhooks/simulate</c> (AuthorityRunCompleted synthetic delivery).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WebhookSimulationControllerTests
{
    [SkippableFact]
    public async Task SimulateAsync_dispatches_payload_and_returns_subscriber_response()
    {
        Uri target = new("https://example.com/webhook");
        OutboundWebhookDryRunResult probeResult = new()
        {
            TransportSucceeded = true,
            StatusCode = 200,
            ReasonPhrase = "OK",
            ResponseBodyPreview = "{\"ok\":true}",
            ResponseBodyTruncated = false,
        };

        Mock<IOutboundWebhookDryRunService> probe = new();
        probe
            .Setup(p => p.ProbeAuthorityRunCompletedAsync(target, "secret", It.IsAny<CancellationToken>()))
            .ReturnsAsync(probeResult);

        Mock<IAuditService> audit = new();

        WebhookSimulationController sut = new(probe.Object, audit.Object);

        OutboundWebhookDryRunRequest body = new()
        {
            TargetUrl = target,
            SharedSecret = "secret",
        };

        IActionResult action = await sut.SimulateAsync(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        OutboundWebhookDryRunResponse response = ok.Value.Should().BeOfType<OutboundWebhookDryRunResponse>().Subject;

        response.TransportSucceeded.Should().BeTrue();
        response.StatusCode.Should().Be(200);
        response.ResponseBodyPreview.Should().Be("{\"ok\":true}");

        probe.Verify(
            p => p.ProbeAuthorityRunCompletedAsync(target, "secret", It.IsAny<CancellationToken>()),
            Times.Once);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.WebhookAuthorityRunCompletedSimulationExecuted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task SimulateAsync_returns_bad_request_when_body_missing()
    {
        WebhookSimulationController sut = new(Mock.Of<IOutboundWebhookDryRunService>(), Mock.Of<IAuditService>());
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult action = await sut.SimulateAsync(body: null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Be("Request body is required.");
        problem.Type.Should().Be(ProblemTypes.RequestBodyRequired);
    }

    [SkippableFact]
    public async Task SimulateAsync_rejects_private_network_target_before_probe()
    {
        Mock<IOutboundWebhookDryRunService> probe = new();

        WebhookSimulationController sut = new(probe.Object, Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        OutboundWebhookDryRunRequest body = new()
        {
            TargetUrl = new Uri("https://10.0.0.5/webhook"),
            SharedSecret = "secret",
        };

        IActionResult action = await sut.SimulateAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        problem.Detail.Should().Contain("TargetUrl");

        probe.Verify(
            p => p.ProbeAuthorityRunCompletedAsync(It.IsAny<Uri>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
