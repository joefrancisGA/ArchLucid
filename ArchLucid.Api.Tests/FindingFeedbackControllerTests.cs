using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

public sealed class FindingFeedbackControllerTests
{
    [Theory]
    [InlineData("finding-1", true)]
    [InlineData(" finding-1 ", true)]
    [InlineData(" finding-missing ", false)]
    public async Task Records_feedback_for_the_normalized_finding_id_only_when_present(string routeFindingId, bool found)
    {
        const string expectedFindingId = "finding-1";
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);
        Mock<IAuthorityQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = runId,
                    Findings = [new Finding { FindingId = expectedFindingId }],
                },
            });
        Mock<IFindingFeedbackRepository> feedback = new();
        feedback.Setup(r => r.InsertAsync(It.IsAny<FindingFeedbackSubmission>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        FindingFeedbackController controller = new(
            query.Object,
            feedback.Object,
            scopeProvider.Object,
            Mock.Of<IManifestHashService>(),
            NullLogger<FindingFeedbackController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.PostFindingFeedbackAsync(
            runId, routeFindingId, new FindingFeedbackPostRequest { Score = 1 }, CancellationToken.None);

        if (!found)
        {
            Assert.Equal(StatusCodes.Status404NotFound, Assert.IsType<ObjectResult>(result).StatusCode);
            feedback.Verify(r => r.InsertAsync(It.IsAny<FindingFeedbackSubmission>(), It.IsAny<CancellationToken>()), Times.Never);
            return;
        }

        // The companion architecture feedback route trims before finding lookup and persistence.
        Assert.IsType<NoContentResult>(result);
        feedback.Verify(r => r.InsertAsync(
            It.Is<FindingFeedbackSubmission>(submission =>
                submission.FindingId == expectedFindingId
                && submission.RunId == runId
                && submission.TenantId == scope.TenantId
                && submission.WorkspaceId == scope.WorkspaceId
                && submission.ProjectId == scope.ProjectId
                && submission.Score == 1),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
