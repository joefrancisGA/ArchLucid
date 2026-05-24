using System.Text.RegularExpressions;

using ArchLucid.Core.Auth.Saml;
using ArchLucid.Core.Authorization;

namespace ArchLucid.Core.Identity;

/// <summary>Validates IdP claim-to-role mapping documents used by SAML SP and OIDC workforce SSO.</summary>
public static class IdentityClaimRoleMappingValidator
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        ArchLucidRoles.Admin,
        ArchLucidRoles.Operator,
        ArchLucidRoles.Reader,
        ArchLucidRoles.Auditor
    };

    public static IReadOnlyList<SamlTestConfigComponentResult> Evaluate(IdentityClaimRoleMappingDocument mapping)
    {
        ArgumentNullException.ThrowIfNull(mapping);

        List<SamlTestConfigComponentResult> results = [];

        string roleClaimName = mapping.RoleClaimName?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(roleClaimName))
        {
            results.Add(new SamlTestConfigComponentResult(
                "claimMapping.roleClaimName",
                SamlTestConfigComponentStatus.Fail,
                "RoleClaimName is required (IdP claim carrying group or role values)."));
        }
        else
        {
            results.Add(new SamlTestConfigComponentResult(
                "claimMapping.roleClaimName",
                SamlTestConfigComponentStatus.Pass,
                $"RoleClaimName is '{roleClaimName}'."));
        }

        if (mapping.Mappings.Count == 0)
        {
            results.Add(new SamlTestConfigComponentResult(
                "claimMapping.mappings",
                SamlTestConfigComponentStatus.Warn,
                "No explicit IdP value mappings were provided; users may only receive roles via CustomGroupClaimRegex."));
        }
        else
        {
            results.Add(new SamlTestConfigComponentResult(
                "claimMapping.mappings",
                SamlTestConfigComponentStatus.Pass,
                $"{mapping.Mappings.Count} explicit IdP value mapping(s) defined."));
        }

        HashSet<string> seenIdpValues = new(StringComparer.OrdinalIgnoreCase);

        foreach (IdentityClaimRoleMappingEntry entry in mapping.Mappings)
        {
            string idpValue = entry.IdpValue?.Trim() ?? string.Empty;
            string archLucidRole = entry.ArchLucidRole?.Trim() ?? string.Empty;
            string component = $"claimMapping.mappings['{idpValue}']";

            if (string.IsNullOrWhiteSpace(idpValue))
            {
                results.Add(new SamlTestConfigComponentResult(
                    component,
                    SamlTestConfigComponentStatus.Fail,
                    "Mapping entry is missing IdpValue."));

                continue;
            }

            if (!seenIdpValues.Add(idpValue))
            {
                results.Add(new SamlTestConfigComponentResult(
                    component,
                    SamlTestConfigComponentStatus.Warn,
                    $"Duplicate IdpValue '{idpValue}' — only the first mapping wins at runtime."));
            }

            if (string.IsNullOrWhiteSpace(archLucidRole))
            {
                results.Add(new SamlTestConfigComponentResult(
                    component,
                    SamlTestConfigComponentStatus.Fail,
                    "Mapping entry is missing ArchLucidRole."));

                continue;
            }

            if (!AllowedRoles.Contains(archLucidRole))
            {
                results.Add(new SamlTestConfigComponentResult(
                    component,
                    SamlTestConfigComponentStatus.Fail,
                    $"ArchLucid role '{archLucidRole}' is not supported. Use Admin, Operator, Reader, or Auditor."));

                continue;
            }

            results.Add(new SamlTestConfigComponentResult(
                component,
                SamlTestConfigComponentStatus.Pass,
                $"Maps to ArchLucid role '{archLucidRole}'."));
        }

        string? regexPattern = mapping.CustomGroupClaimRegex?.Trim();

        if (string.IsNullOrWhiteSpace(regexPattern))
        {
            results.Add(new SamlTestConfigComponentResult(
                "claimMapping.customGroupClaimRegex",
                SamlTestConfigComponentStatus.Pass,
                "CustomGroupClaimRegex is not configured (optional)."));

            return results;
        }

        try
        {
            _ = new Regex(regexPattern, RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

            results.Add(new SamlTestConfigComponentResult(
                "claimMapping.customGroupClaimRegex",
                SamlTestConfigComponentStatus.Pass,
                "CustomGroupClaimRegex compiles successfully."));
        }
        catch (ArgumentException ex)
        {
            results.Add(new SamlTestConfigComponentResult(
                "claimMapping.customGroupClaimRegex",
                SamlTestConfigComponentStatus.Fail,
                $"CustomGroupClaimRegex is invalid: {ex.Message}"));
        }

        return results;
    }

    public static void ValidateOrThrow(IdentityClaimRoleMappingDocument mapping)
    {
        ArgumentNullException.ThrowIfNull(mapping);

        IReadOnlyList<SamlTestConfigComponentResult> results = Evaluate(mapping);

        SamlTestConfigComponentResult? firstFailure = results
            .FirstOrDefault(static r => r.Status == SamlTestConfigComponentStatus.Fail);

        if (firstFailure is not null)
        {
            throw new ArgumentException(firstFailure.Detail);
        }
    }
}
