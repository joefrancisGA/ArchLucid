using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Request validation for policy pack HTTP routes.</summary>
public static class PolicyPacksHttpMapper
{
    public static GovernanceHttpValidation? ValidateRouteId(Guid id, string parameterName)
    {
        if (id == Guid.Empty)
            return new GovernanceHttpValidation($"{parameterName} is required.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidatePackVersion(string? packVersion)
    {
        if (string.IsNullOrWhiteSpace(packVersion))
            return new GovernanceHttpValidation("Version is required.", ProblemTypes.ValidationFailed);

        string trimmedVersion = packVersion.Trim();

        if (trimmedVersion.Length > PolicyPackRequestValidationRules.PackVersionMaxLength)
        {
            return new GovernanceHttpValidation(
                $"Version must be at most {PolicyPackRequestValidationRules.PackVersionMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (!PolicyPackRequestValidationRules.BePolicyPackSemVerVersion(trimmedVersion))
        {
            return new GovernanceHttpValidation(
                PolicyPackRequestValidationRules.PackVersionSemVerMessage,
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidatePromoteCatalogEntry(PromotePolicyPackCatalogEntryRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.SourcePolicyPackId == Guid.Empty)
        {
            return new GovernanceHttpValidation(
                "sourcePolicyPackId is required.",
                ProblemTypes.ValidationFailed);
        }

        if (request.Version is not null)
        {
            GovernanceHttpValidation? versionValidation = ValidatePackVersion(request.Version);

            if (versionValidation is not null)
                return versionValidation;
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateDemoteCatalogEntry(DemotePolicyPackCatalogEntryRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.PolicyPackCatalogEntryId == Guid.Empty)
            return new GovernanceHttpValidation("policyPackCatalogEntryId is required.", ProblemTypes.ValidationFailed);

        return null;
    }
}
