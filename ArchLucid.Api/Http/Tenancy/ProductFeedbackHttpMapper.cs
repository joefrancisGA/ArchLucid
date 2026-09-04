using ArchLucid.Api.Models.CustomerSuccess;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Api.Http.Governance;

namespace ArchLucid.Api.Http.Tenancy;

/// <summary>Request validation for tenant product-feedback HTTP routes.</summary>
internal static class ProductFeedbackHttpMapper
{
    internal const int FindingRefMaxLength = 512;

    internal const int CommentMaxLength = 2000;

    internal static GovernanceHttpValidation? Validate(ProductFeedbackRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.RunId == Guid.Empty)
        {
            return new GovernanceHttpValidation(
                "runId must be a non-empty GUID when provided.",
                ProblemTypes.ValidationFailed);
        }

        if (!string.IsNullOrWhiteSpace(request.FindingRef))
        {
            string findingRef = request.FindingRef.Trim();

            if (findingRef.Length > FindingRefMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"FindingRef exceeds maximum length ({FindingRefMaxLength}).",
                    ProblemTypes.ValidationFailed);
            }

            if (findingRef.Length > GovernanceRequestValidationRules.FindingIdMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"FindingRef must not exceed {GovernanceRequestValidationRules.FindingIdMaxLength} characters.",
                    ProblemTypes.ValidationFailed);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Comment) && request.Comment.Trim().Length > CommentMaxLength)
        {
            return new GovernanceHttpValidation(
                $"Comment exceeds maximum length ({CommentMaxLength}).",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
