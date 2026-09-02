using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
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

        if (body.Decision is null)
            return new GovernanceHttpValidation("Decision is required (approve or reject).", ProblemTypes.ValidationFailed);

        string decision = body.Decision.Trim();

        if (decision.Length == 0)
            return new GovernanceHttpValidation("Decision is required (approve or reject).", ProblemTypes.ValidationFailed);

        bool approve = string.Equals(decision, "approve", StringComparison.OrdinalIgnoreCase);
        bool reject = string.Equals(decision, "reject", StringComparison.OrdinalIgnoreCase);

        if (!approve && !reject)
            return new GovernanceHttpValidation("Decision must be 'approve' or 'reject'.", ProblemTypes.ValidationFailed);

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
