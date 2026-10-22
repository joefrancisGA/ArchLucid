using ArchLucid.Api.Controllers.User;
using ArchLucid.Application.Operator;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.User;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Unit coverage for <c>GET /v1/user/attention-summary</c>.</summary>
[Trait("Category", "Unit")]
public sealed class UserAttentionSummaryControllerTests
{
    [SkippableFact]
    public async Task GetAttentionSummary_ReturnsRollupCounts()
    {
        Mock<IOperatorShellStatusService> shellStatusService = new();
        shellStatusService
            .Setup(service => service.BuildAsync(false, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OperatorShellStatusResult
            {
                AssignedToMeFindingsCount = 4,
                ReviewsAwaitingAction = new GovernanceReviewsAwaitingActionResponse
                {
                    Items =
                    [
                        new GovernanceReviewAwaitingActionItem { RunId = Guid.NewGuid(), Name = "Run A" },
                        new GovernanceReviewAwaitingActionItem { RunId = Guid.NewGuid(), Name = "Run B" },
                    ],
                },
                AlertsInboxSummary = new AlertsInboxSummaryDto { OpenCount = 3 },
            });

        UserAttentionSummaryController sut = CreateController(shellStatusService.Object, TimeProvider.System);

        IActionResult result = await sut.GetAttentionSummaryAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        UserAttentionSummaryResponse body = ok.Value.Should().BeOfType<UserAttentionSummaryResponse>().Subject;
        body.AssignedToMeFindingsCount.Should().Be(4);
        body.AwaitingApprovalCount.Should().Be(2);
        body.AlertsOpenCount.Should().Be(3);
        body.CheckedAtUtc.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    private static UserAttentionSummaryController CreateController(
        IOperatorShellStatusService shellStatusService,
        TimeProvider timeProvider)
    {
        UserAttentionSummaryController controller = new(shellStatusService, timeProvider)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext(),
            },
        };

        return controller;
    }
}
