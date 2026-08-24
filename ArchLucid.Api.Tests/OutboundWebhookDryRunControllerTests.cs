using ArchLucid.Api.Controllers.Webhooks;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OutboundWebhookDryRunControllerTests
{
    [Fact]
    public async Task DryRunAsync_returns_probe_outcome_and_audits()
    {
        Uri target = new("https://example.com/webhook");
        OutboundWebhookDryRunResult probeResult = new()
        {
            TransportSucceeded = true,
            StatusCode = 202,
            ReasonPhrase = "Accepted",
            ResponseBodyPreview = "ok",
            ResponseBodyTruncated = false
        };

        Mock<IOutboundWebhookDryRunService> probe = new();
        probe
            .Setup(p => p.ProbeAsync(target, "secret", It.IsAny<CancellationToken>()))
            .ReturnsAsync(probeResult);

        Mock<IAuditService> audit = new();

        OutboundWebhookDryRunController controller = new(probe.Object, audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        OutboundWebhookDryRunRequest body = new()
        {
            TargetUrl = target,
            SharedSecret = "secret"
        };

        IActionResult action = await controller.DryRunAsync(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        OutboundWebhookDryRunResponse response = ok.Value.Should().BeOfType<OutboundWebhookDryRunResponse>().Subject;

        response.TransportSucceeded.Should().BeTrue();
        response.StatusCode.Should().Be(202);
        response.ResponseBodyPreview.Should().Be("ok");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.OutboundWebhookDryRunProbeExecuted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DryRunAsync_null_body_returns_400()
    {
        OutboundWebhookDryRunController controller = new(
            Mock.Of<IOutboundWebhookDryRunService>(),
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.DryRunAsync(body: null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.RequestBodyRequired);
    }

    [Fact]
    public async Task DryRunAsync_rejects_loopback_target_before_probe()
    {
        Mock<IOutboundWebhookDryRunService> probe = new();

        OutboundWebhookDryRunController controller = new(probe.Object, Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        OutboundWebhookDryRunRequest body = new()
        {
            TargetUrl = new Uri("https://127.0.0.1/webhook"),
            SharedSecret = "secret",
        };

        IActionResult action = await controller.DryRunAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        problem.Detail.Should().Contain("TargetUrl");

        probe.Verify(
            p => p.ProbeAsync(It.IsAny<Uri>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
