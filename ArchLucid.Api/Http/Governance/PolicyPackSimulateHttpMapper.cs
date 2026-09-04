using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;

using FluentValidation.Results;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Body validation for <c>POST /v1/policy-packs/simulate</c> before scope preflight.</summary>
public static class PolicyPackSimulateHttpMapper
{
    private static readonly PolicyPackSimulateRequestValidator Validator = new();

    public static GovernanceHttpValidation? Validate(PolicyPackSimulateRequest request)
    {
        ValidationResult validationResult = Validator.Validate(request);

        if (validationResult.IsValid)
            return null;

        ValidationFailure firstError = validationResult.Errors[0];

        return new GovernanceHttpValidation(firstError.ErrorMessage, ProblemTypes.ValidationFailed);
    }
}
