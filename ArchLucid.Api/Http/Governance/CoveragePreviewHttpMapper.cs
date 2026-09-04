using ArchLucid.Api.Models.Coverage;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Body validation for <c>POST /v1/governance/coverage/preview</c> before tenant preflight.</summary>
public static class CoveragePreviewHttpMapper
{
    public static GovernanceHttpValidation? Validate(CoveragePreviewRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!Enum.IsDefined(request.CloudProvider))
        {
            return new GovernanceHttpValidation(
                "cloudProvider is not valid.",
                ProblemTypes.ValidationFailed);
        }

        GovernanceHttpValidation? descriptionProblem =
            ValidateFreeTextLength(request.DescriptionText, "DescriptionText");

        if (descriptionProblem is not null)
            return descriptionProblem;

        return ValidateFreeTextLength(request.SecurityIntakeAnswer, "SecurityIntakeAnswer");
    }

    private static GovernanceHttpValidation? ValidateFreeTextLength(string? text, string fieldName)
    {
        if (text is null || !DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(text))
            return null;

        return new GovernanceHttpValidation(
            $"{fieldName} must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters.",
            ProblemTypes.ValidationFailed);
    }
}
