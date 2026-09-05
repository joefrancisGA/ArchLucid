using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Request validation and response mapping for governance approval-request HTTP routes.</summary>
public static class GovernanceApprovalRequestsHttpMapper
{
    public const int MaxBatchReviewCount = 50;

    public static string NormalizeApprovalRequestId(string approvalRequestId) =>
        approvalRequestId.Trim();

    public static GovernanceHttpValidation? ValidateApprovalRequestId(string approvalRequestId)
    {
        if (string.IsNullOrWhiteSpace(approvalRequestId))
            return new GovernanceHttpValidation("approvalRequestId is required.", ProblemTypes.ValidationFailed);

        if (approvalRequestId.Length > GovernanceRequestValidationRules.ApprovalRequestIdMaxLength)
        {
            return new GovernanceHttpValidation(
                $"approvalRequestId must not exceed {GovernanceRequestValidationRules.ApprovalRequestIdMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateManifestVersion(string? manifestVersion)
    {
        if (string.IsNullOrWhiteSpace(manifestVersion))
        {
            return new GovernanceHttpValidation(
                "ManifestVersion is required.",
                ProblemTypes.ValidationFailed);
        }

        if (manifestVersion.Trim().Length > GovernanceRequestValidationRules.ManifestVersionMaxLength)
        {
            return new GovernanceHttpValidation(
                $"ManifestVersion must not exceed {GovernanceRequestValidationRules.ManifestVersionMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateGovernanceRunId(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return new GovernanceHttpValidation("RunId is required.", ProblemTypes.ValidationFailed);

        if (runId.Trim().Length > GovernanceRequestValidationRules.RunIdMaxLength)
        {
            return new GovernanceHttpValidation(
                $"RunId must not exceed {GovernanceRequestValidationRules.RunIdMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateGovernanceRouteRunId(string? runId)
    {
        GovernanceHttpValidation? runIdValidation = ValidateGovernanceRunId(runId);

        if (runIdValidation is not null)
            return runIdValidation;

        if (!Guid.TryParse(runId!.Trim(), out Guid parsedRunId) || parsedRunId == Guid.Empty)
            return new GovernanceHttpValidation("RunId is not valid.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateEnvironmentSlug(string? environment, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(environment))
            return new GovernanceHttpValidation($"{fieldName} is required.", ProblemTypes.ValidationFailed);

        if (environment.Trim().Length > GovernanceEnvironmentSlug.MaxLength)
        {
            return new GovernanceHttpValidation(
                $"{fieldName} must not exceed {GovernanceEnvironmentSlug.MaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateReviewComment(string? reviewComment) =>
        ValidateOptionalGovernanceComment(reviewComment, "ReviewComment");

    public static GovernanceHttpValidation? ValidateOptionalGovernanceComment(string? value, string fieldName)
    {
        if (value is not null && string.IsNullOrWhiteSpace(value))
        {
            return new GovernanceHttpValidation(
                $"{fieldName} cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (value is not null && value.Length > GovernanceRequestValidationRules.ReviewCommentMaxLength)
        {
            return new GovernanceHttpValidation(
                $"{fieldName} must not exceed {GovernanceRequestValidationRules.ReviewCommentMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateOptionalApprovalRequestId(string? approvalRequestId)
    {
        if (approvalRequestId is null)
            return null;

        string normalizedApprovalRequestId = approvalRequestId.Trim();

        if (normalizedApprovalRequestId.Length == 0)
        {
            return new GovernanceHttpValidation(
                "approvalRequestId is required.",
                ProblemTypes.ValidationFailed);
        }

        if (normalizedApprovalRequestId.Length > GovernanceRequestValidationRules.ApprovalRequestIdMaxLength)
        {
            return new GovernanceHttpValidation(
                $"approvalRequestId must not exceed {GovernanceRequestValidationRules.ApprovalRequestIdMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateBatchReviewRequest(GovernanceApprovalBatchReviewRequest? body)
    {
        if (body is null)
            return new GovernanceHttpValidation("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.ApprovalRequestIds is null || body.ApprovalRequestIds.Count == 0)
        {
            return new GovernanceHttpValidation(
                "ApprovalRequestIds must contain at least one id.",
                ProblemTypes.ValidationFailed);
        }

        if (body.ApprovalRequestIds.Count > MaxBatchReviewCount)
        {
            return new GovernanceHttpValidation(
                "At most 50 approval request ids are allowed per request.",
                ProblemTypes.ValidationFailed);
        }

        if (!body.ApprovalRequestIds.Any(static id => !string.IsNullOrWhiteSpace(id)))
        {
            return new GovernanceHttpValidation(
                "ApprovalRequestIds must contain at least one non-empty id.",
                ProblemTypes.ValidationFailed);
        }

        foreach (string rawApprovalRequestId in body.ApprovalRequestIds)
        {
            if (string.IsNullOrWhiteSpace(rawApprovalRequestId))
                continue;

            string normalizedApprovalRequestId = rawApprovalRequestId.Trim();

            if (normalizedApprovalRequestId.Length > GovernanceRequestValidationRules.ApprovalRequestIdMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"Each approvalRequestId must not exceed {GovernanceRequestValidationRules.ApprovalRequestIdMaxLength} characters.",
                    ProblemTypes.ValidationFailed);
            }
        }

        if (body.Decision is null)
            return new GovernanceHttpValidation("Decision is required (approve or reject).", ProblemTypes.ValidationFailed);

        string decision = body.Decision.Trim();

        if (decision.Length == 0)
            return new GovernanceHttpValidation("Decision is required (approve or reject).", ProblemTypes.ValidationFailed);

        bool approve = string.Equals(decision, "approve", StringComparison.OrdinalIgnoreCase);
        bool reject = string.Equals(decision, "reject", StringComparison.OrdinalIgnoreCase);

        if (!approve && !reject)
            return new GovernanceHttpValidation("Decision must be 'approve' or 'reject'.", ProblemTypes.ValidationFailed);

        GovernanceHttpValidation? reviewCommentValidation = ValidateReviewComment(body.ReviewComment);

        if (reviewCommentValidation is not null)
            return reviewCommentValidation;

        return null;
    }

    public static bool TryParseBatchReviewDecision(string decision, out bool approve)
    {
        approve = string.Equals(decision.Trim(), "approve", StringComparison.OrdinalIgnoreCase);
        bool reject = string.Equals(decision.Trim(), "reject", StringComparison.OrdinalIgnoreCase);

        return approve || reject;
    }

    public static Controllers.Governance.GovernanceBatchReviewResponse MapBatchReviewResponse(
        Application.Governance.GovernanceBatchReviewResponse batchResult) =>
        new()
        {
            Results = batchResult.Results
                .Select(static r => new Controllers.Governance.GovernanceBatchReviewItemResult
                {
                    ApprovalRequestId = r.ApprovalRequestId,
                    Succeeded = r.Succeeded,
                    ErrorCode = r.ErrorCode,
                    Message = r.Message,
                })
                .ToList(),
        };
}
