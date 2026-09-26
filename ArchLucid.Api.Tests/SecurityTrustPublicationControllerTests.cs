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
}
