using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Governance.PolicyPacks;

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

    public static bool TryParsePackVersion(
        string? packVersion,
        out PolicyPackSemVerVersion normalized,
        out GovernanceHttpValidation? validationError)
    {
        normalized = default;
        validationError = null;

        if (string.IsNullOrWhiteSpace(packVersion))
        {
            validationError = new GovernanceHttpValidation("Version is required.", ProblemTypes.ValidationFailed);
            return false;
        }

        string trimmedVersion = packVersion.Trim();

        if (trimmedVersion.Length > PolicyPackSemVerVersion.MaxLength)
        {
            validationError = new GovernanceHttpValidation(
                $"Version must be at most {PolicyPackSemVerVersion.MaxLength} characters.",
                ProblemTypes.ValidationFailed);

            return false;
        }

        if (!PolicyPackSemVerVersion.TryParse(packVersion, out normalized))
        {
            validationError = new GovernanceHttpValidation(
                PolicyPackRequestValidationRules.PackVersionSemVerMessage,
                ProblemTypes.ValidationFailed);

            return false;
        }

        return true;
    }

    public static GovernanceHttpValidation? ValidatePackVersion(string? packVersion) =>
        TryParsePackVersion(packVersion, out _, out GovernanceHttpValidation? validationError)
            ? null
            : validationError;

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
