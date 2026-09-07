using System.Text.Json;

using ArchLucid.Api.Controllers.Webhooks;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Security;

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

    [Fact]
    public async Task DryRunAsync_returns_200_with_transport_failed_outcome_in_body()
    {
        Uri target = new("https://example.com/webhook");
        OutboundWebhookDryRunResult probeResult = new()
        {
            TransportSucceeded = false,
            StatusCode = 0,
            Error = "HttpRequestException: connection refused",
        };

        Mock<IOutboundWebhookDryRunService> probe = new();
        probe
            .Setup(p => p.ProbeAsync(target, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(probeResult);

        OutboundWebhookDryRunController controller = new(probe.Object, Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.DryRunAsync(
            new OutboundWebhookDryRunRequest { TargetUrl = target },
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        OutboundWebhookDryRunResponse response = ok.Value.Should().BeOfType<OutboundWebhookDryRunResponse>().Subject;

        response.TransportSucceeded.Should().BeFalse();
        response.StatusCode.Should().Be(0);
        response.Error.Should().Contain("connection refused");
    }

    [Fact]
    public async Task DryRunAsync_audit_records_hasSharedSecret_false_when_shared_secret_is_whitespace_only()
    {
        Uri target = new("https://example.com/webhook");
        Mock<IOutboundWebhookDryRunService> probe = new();
        probe
            .Setup(p => p.ProbeAsync(target, "   ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OutboundWebhookDryRunResult { TransportSucceeded = true, StatusCode = 200 });

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        OutboundWebhookDryRunController controller = new(probe.Object, audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        await controller.DryRunAsync(
            new OutboundWebhookDryRunRequest { TargetUrl = target, SharedSecret = "   " },
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson!);
        document.RootElement.GetProperty("hasSharedSecret").GetBoolean().Should().BeFalse(
            "whitespace-only secrets are trimmed before signing and must not appear as configured in audit.");
    }

    [Fact]
    public async Task DryRunAsync_audit_records_response_body_truncated_when_preview_truncated()
    {
        Uri target = new("https://example.com/webhook");
        Mock<IOutboundWebhookDryRunService> probe = new();
        probe
            .Setup(p => p.ProbeAsync(target, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OutboundWebhookDryRunResult
            {
                TransportSucceeded = true,
                StatusCode = 200,
                ResponseBodyPreview = new string('x', 100),
                ResponseBodyTruncated = true
            });

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        OutboundWebhookDryRunController controller = new(probe.Object, audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        await controller.DryRunAsync(
            new OutboundWebhookDryRunRequest { TargetUrl = target },
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson!);
        document.RootElement.GetProperty("responseBodyTruncated").GetBoolean().Should().BeTrue(
            "audit must record when the subscriber response preview was truncated.");
    }

    [Theory]
    [InlineData("https://hooks.example.com/webhook")]
    [InlineData("https://example.com:8443/path?q=1")]
    [InlineData("https://127.0.0.1/webhook")]
    [InlineData("https://[::1]/webhook")]
    public void DryRunAsync_target_url_to_string_round_trip_matches_ssrf_guard_decision(string rawUrl)
    {
        Uri target = new(rawUrl);
        Uri reparsed = new Uri(target.ToString(), UriKind.Absolute);

        reparsed.IdnHost.Should().Be(target.IdnHost);

        AllowedOutboundWebhookProbeUrlPolicy.TryGetRejectionReason(target.ToString())
            .Should().Be(AllowedOutboundWebhookProbeUrlPolicy.TryGetRejectionReason(reparsed.ToString()));
    }
}
