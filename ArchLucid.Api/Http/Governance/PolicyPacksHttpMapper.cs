using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.ProblemDetails;

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
