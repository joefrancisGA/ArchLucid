using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceApprovalRequestsHttpMapperTests
{
    [Fact]
    public void ValidateApprovalRequestId_rejects_overlong_id()
    {
        string overlongId = new string('a', GovernanceRequestValidationRules.ApprovalRequestIdMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceApprovalRequestsHttpMapper.ValidateApprovalRequestId(overlongId);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.ApprovalRequestIdMaxLength.ToString());
    }

    [Fact]
    public void ValidateBatchReviewRequest_rejects_overlong_approval_request_id()
    {
        string overlongId = new string('a', GovernanceRequestValidationRules.ApprovalRequestIdMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [overlongId],
                Decision = "approve",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.ApprovalRequestIdMaxLength.ToString());
    }

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
    public void ValidateBatchReviewRequest_rejects_overlong_review_comment()
    {
        GovernanceHttpValidation? validation = GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = ["req-1"],
                Decision = "approve",
                ReviewComment = new string('c', GovernanceRequestValidationRules.ReviewCommentMaxLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.ReviewCommentMaxLength.ToString());
    }

    [Fact]
    public void ValidateReviewComment_rejects_overlong_comment()
    {
        GovernanceHttpValidation? validation = GovernanceApprovalRequestsHttpMapper.ValidateReviewComment(
            new string('c', GovernanceRequestValidationRules.ReviewCommentMaxLength + 1));

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.ReviewCommentMaxLength.ToString());
    }

    [Fact]
    public void ValidateManifestVersion_rejects_overlong_version()
    {
        string overlongVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);

        GovernanceHttpValidation? validation =
            GovernanceApprovalRequestsHttpMapper.ValidateManifestVersion(overlongVersion);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.ManifestVersionMaxLength.ToString());
    }

    [Fact]
    public void ValidateGovernanceRunId_rejects_overlong_run_id()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);

        GovernanceHttpValidation? validation =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRunId(overlongRunId);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.RunIdMaxLength.ToString());
    }

    [Fact]
    public void ValidateEnvironmentSlug_rejects_overlong_slug()
    {
        string overlongSlug = new string('e', GovernanceEnvironmentSlug.MaxLength + 1);

        GovernanceHttpValidation? validation =
            GovernanceApprovalRequestsHttpMapper.ValidateEnvironmentSlug(overlongSlug, "SourceEnvironment");

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceEnvironmentSlug.MaxLength.ToString());
    }

    [Fact]
    public void ValidateOptionalGovernanceComment_rejects_overlong_notes()
    {
        GovernanceHttpValidation? validation = GovernanceApprovalRequestsHttpMapper.ValidateOptionalGovernanceComment(
            new string('n', GovernanceRequestValidationRules.ReviewCommentMaxLength + 1),
            "Notes");

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("Notes");
    }

    [Fact]
    public void ValidateOptionalApprovalRequestId_rejects_overlong_id()
    {
        string overlongId = new string('a', GovernanceRequestValidationRules.ApprovalRequestIdMaxLength + 1);

        GovernanceHttpValidation? validation =
            GovernanceApprovalRequestsHttpMapper.ValidateOptionalApprovalRequestId(overlongId);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.ApprovalRequestIdMaxLength.ToString());
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
