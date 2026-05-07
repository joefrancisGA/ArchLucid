using ArchLucid.Api.Controllers.Alerts;
using ArchLucid.Api.Models.Alerts;
using ArchLucid.Application.Alerts;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Alerts;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AlertsControllerActionLoopTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetActionLoop_returns_404_when_reader_returns_null()
    {
        Guid alertId = Guid.NewGuid();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAlertRecordRepository> records = new();

        Mock<IAlertActionLoopReader> reader = new();
        reader.Setup(r => r.GetAsync(alertId, Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertActionLoopSnapshot?)null);

        Mock<IAlertService> alertService = new();

        AlertsController sut = new(
            scope.Object,
            records.Object,
            alertService.Object,
            reader.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetActionLoop(alertId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeAssignableTo<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task GetActionLoop_returns_body_when_snapshot_exists()
    {
        Guid alertId = Guid.NewGuid();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAlertRecordRepository> records = new();

        Mock<IAlertActionLoopReader> reader = new();
        reader.Setup(r => r.GetAsync(alertId, Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new AlertActionLoopSnapshot
                {
                    AlertId = alertId,
                    Status = "Open",
                    DeliveryAttempts =
                    [
                        new AlertDeliveryAttemptSummary
                        {
                            ChannelType = "Email",
                            Status = "Succeeded",
                            AttemptedUtc = new DateTimeOffset(2026, 5, 1, 12, 0, 0, TimeSpan.Zero),
                            DestinationRedacted = "[email-redacted]",
                        },
                    ],
                });

        Mock<IAlertService> alertService = new();

        AlertsController sut = new(
            scope.Object,
            records.Object,
            alertService.Object,
            reader.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetActionLoop(alertId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        AlertActionLoopResponse body = ok.Value.Should().BeAssignableTo<AlertActionLoopResponse>().Subject;
        body.AlertId.Should().Be(alertId);
        body.DeliveryAttempts.Should().ContainSingle();
        body.DeliveryAttempts[0].DestinationRedacted.Should().Be("[email-redacted]");
    }
}
