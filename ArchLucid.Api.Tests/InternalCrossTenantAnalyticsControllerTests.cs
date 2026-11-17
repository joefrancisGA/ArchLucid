using ArchLucid.Api.Controllers.Analytics;
using ArchLucid.Core.Analytics;
using ArchLucid.Core.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InternalCrossTenantAnalyticsControllerTests
{
    [Fact]
    public async Task Committed_refresh_records_audit_when_the_request_is_canceled()
    {
        DateOnly day = new(2026, 11, 16);
        using CancellationTokenSource request = new();
        Mock<IInternalCrossTenantAnalyticsService> analytics = new(MockBehavior.Strict);
        analytics.Setup(service => service.RefreshDailyRollupsAsync(day, request.Token))
            .Callback(request.Cancel)
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit.Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns((AuditEvent _, CancellationToken ct) => ct.IsCancellationRequested
                ? Task.FromCanceled(ct)
                : Task.CompletedTask);
        InternalCrossTenantAnalyticsController controller = new(analytics.Object, audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.RefreshDailyRollupsAsync(day, request.Token);

        result.Should().BeOfType<NoContentResult>();
        audit.Verify(service => service.LogAsync(
            It.Is<AuditEvent>(entry => entry.EventType == AuditEventTypes.InternalCrossTenantRollupRefreshed),
            CancellationToken.None), Times.Once);
    }
}
