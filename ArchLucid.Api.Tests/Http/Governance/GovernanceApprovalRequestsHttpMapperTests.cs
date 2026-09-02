using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceApprovalRequestsHttpMapperTests
{
    [Fact]
    public void ValidateBatchReviewRequest_rejects_empty_ids()
    {
        GovernanceHttpValidation? validation = GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [],
                Decision = "approve",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void ValidateBatchReviewRequest_rejects_unknown_decision()
    {
        GovernanceHttpValidation? validation = GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = ["req-1"],
                Decision = "defer",
            });

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("'approve' or 'reject'");
    }

    [Fact]
    public void MapBatchReviewResponse_maps_application_rows()
    {
        GovernanceBatchReviewResponse mapped = GovernanceApprovalRequestsHttpMapper.MapBatchReviewResponse(
            new Application.Governance.GovernanceBatchReviewResponse
            {
                Results =
                [
                    new Application.Governance.GovernanceBatchReviewItemResult
                    {
                        ApprovalRequestId = "req-1",
                        Succeeded = true,
                    },
                ],
            });

        mapped.Results.Should().ContainSingle();
        mapped.Results[0].ApprovalRequestId.Should().Be("req-1");
        mapped.Results[0].Succeeded.Should().BeTrue();
    }
}
