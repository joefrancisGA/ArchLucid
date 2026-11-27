using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SecurityTrustPublicationControllerTests
{
    [Fact]
    public async Task PublishAsync_returns_bad_request_when_assessor_display_name_contains_invalid_surrogate()
    {
        Mock<IAuditService> auditService = new(MockBehavior.Strict);

        SecurityTrustPublicationController controller = new(auditService.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        SecurityAssessmentPublicationRequest body = new()
        {
            AssessmentCode = "2026-Q2",
            SummaryReference = "docs/trust/2026-q2-summary.md",
            AssessorDisplayName = "Assessor \uD800",
        };

        IActionResult action = await controller.PublishAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        auditService.Verify(
            s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Theory]
    [InlineData("11/27/2026")]
    [InlineData("2026/11/27")]
    [InlineData("2026-02-29")]
    public async Task PublishAsync_rejects_noncanonical_or_invalid_calendar_date(string publishedOn)
    {
        Mock<IAuditService> auditService = new();
        SecurityTrustPublicationController controller = new(auditService.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        SecurityAssessmentPublicationRequest body = new()
        {
            AssessmentCode = "2026-Q2",
            SummaryReference = "docs/trust/2026-q2-summary.md",
            PublishedOn = publishedOn,
        };

        IActionResult action = await controller.PublishAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Which.Detail.Should()
            .Be("PublishedOn must be a calendar date (YYYY-MM-DD).");
        auditService.Verify(
            s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Theory]
    [InlineData("2024-02-29", "2024-02-29")]
    [InlineData("  2026-11-27  ", "2026-11-27")]
    [InlineData(null, null)]
    [InlineData("  ", null)]
    public async Task PublishAsync_audits_only_canonical_or_absent_calendar_date(string? publishedOn, string? expected)
    {
        Mock<IAuditService> auditService = new(MockBehavior.Strict);
        AuditEvent? recorded = null;
        auditService.Setup(s => s.LogAsync(It.IsAny<AuditEvent>(), CancellationToken.None))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => recorded = auditEvent)
            .Returns(Task.CompletedTask);
        SecurityTrustPublicationController controller = new(auditService.Object);
        SecurityAssessmentPublicationRequest body = new()
        {
            AssessmentCode = "2026-Q2",
            SummaryReference = "docs/trust/2026-q2-summary.md",
            PublishedOn = publishedOn,
        };

        IActionResult action = await controller.PublishAsync(body, CancellationToken.None);

        action.Should().BeOfType<NoContentResult>();
        auditService.Verify(s => s.LogAsync(It.IsAny<AuditEvent>(), CancellationToken.None), Times.Once);
        recorded.Should().NotBeNull();
        recorded!.EventType.Should().Be(AuditEventTypes.SecurityAssessmentPublished);
        using JsonDocument payload = JsonDocument.Parse(recorded.DataJson);
        payload.RootElement.GetProperty("publishedOn").GetString().Should().Be(expected);
    }
}
