using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;

using FluentValidation.Results;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Body validation for <c>POST /v1/governance/promotions</c> before tenant preflight.</summary>
public static class GovernancePromotionHttpMapper
{
    private static readonly CreateGovernancePromotionRequestValidator Validator = new();

    public static GovernanceHttpValidation? Validate(CreateGovernancePromotionRequest request)
    {
        ValidationResult validationResult = Validator.Validate(request);

        if (validationResult.IsValid)
            return null;

        ValidationFailure firstError = validationResult.Errors[0];

        return new GovernanceHttpValidation(firstError.ErrorMessage, ProblemTypes.ValidationFailed);
    }
}
