using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Shared substantive-text guards for SSO wizard claim-mapping documents (activate and sandbox test-login).
/// </summary>
internal static class IdentityProviderClaimMappingSubstantiveGuards
{
    internal static void EnsureNoNullMappingEntries(IdentityClaimRoleMappingRequest request)
    {
        foreach (IdentityClaimRoleMappingEntryRequest? entry in request.Mappings)
        {
            if (entry is null)
                throw new ArgumentException("ClaimMapping.Mappings cannot contain null entries.");
        }
    }

    internal static void EnsureSubstantiveClaimMapping(IdentityClaimRoleMappingDocument mapping)
    {
        if (!IdentityProviderSubstantiveTextValidation.HasSubstantiveText(mapping.RoleClaimName))
        {
            throw new ArgumentException(
                "RoleClaimName is required (IdP claim carrying group or role values).");
        }

        if (mapping.CustomGroupClaimRegex is not null
            && !IdentityProviderSubstantiveTextValidation.HasSubstantiveText(mapping.CustomGroupClaimRegex))
        {
            throw new ArgumentException("CustomGroupClaimRegex is not valid.");
        }

        foreach (IdentityClaimRoleMappingEntry entry in mapping.Mappings)
        {
            if (!IdentityProviderSubstantiveTextValidation.HasSubstantiveText(entry.IdpValue))
                throw new ArgumentException("Mapping entry is missing IdpValue.");

            if (!IdentityProviderSubstantiveTextValidation.HasSubstantiveText(entry.ArchLucidRole))
                throw new ArgumentException("Mapping entry is missing ArchLucidRole.");
        }
    }
}
