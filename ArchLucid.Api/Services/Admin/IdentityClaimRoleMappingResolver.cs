using System.Text.RegularExpressions;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Resolves IdP claim values to ArchLucid roles using wizard mapping rules.</summary>
public static class IdentityClaimRoleMappingResolver
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        ArchLucidRoles.Admin,
        ArchLucidRoles.Operator,
        ArchLucidRoles.Reader,
        ArchLucidRoles.Auditor
    };

    public static IdentityClaimRoleMappingDocument ToDocument(IdentityClaimRoleMappingRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        List<IdentityClaimRoleMappingEntry> mappings = request.Mappings
            .Where(static m => !string.IsNullOrWhiteSpace(m.IdpValue) && !string.IsNullOrWhiteSpace(m.ArchLucidRole))
            .Select(static m => new IdentityClaimRoleMappingEntry
            {
                IdpValue = m.IdpValue.Trim(),
                ArchLucidRole = m.ArchLucidRole.Trim()
            })
            .ToList();

        return new IdentityClaimRoleMappingDocument
        {
            RoleClaimName = request.RoleClaimName?.Trim() ?? string.Empty,
            Mappings = mappings,
            CustomGroupClaimRegex = string.IsNullOrWhiteSpace(request.CustomGroupClaimRegex)
                ? null
                : request.CustomGroupClaimRegex.Trim()
        };
    }

    public static IReadOnlyList<string> ResolveRoles(
        IdentityClaimRoleMappingDocument mapping,
        IReadOnlyList<string> sampleClaimValues)
    {
        ArgumentNullException.ThrowIfNull(mapping);
        ArgumentNullException.ThrowIfNull(sampleClaimValues);

        HashSet<string> roles = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> lookup = mapping.Mappings
            .GroupBy(static m => m.IdpValue, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static g => g.Key, static g => g.First().ArchLucidRole, StringComparer.OrdinalIgnoreCase);

        Regex? regex = null;

        if (!string.IsNullOrWhiteSpace(mapping.CustomGroupClaimRegex))
        {
            regex = new Regex(mapping.CustomGroupClaimRegex, RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
        }

        foreach (string rawValue in sampleClaimValues)
        {
            string value = rawValue?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(value))
                continue;

            if (lookup.TryGetValue(value, out string? mapped) && AllowedRoles.Contains(mapped))
                roles.Add(mapped);

            if (regex is null)
                continue;

            Match match = regex.Match(value);

            if (!match.Success)
                continue;

            if (match.Groups.Count > 1)
            {
                string capturedRole = match.Groups[1].Value.Trim();

                if (AllowedRoles.Contains(capturedRole))
                    roles.Add(capturedRole);
            }
        }

        return roles.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase).ToList();
    }

    public static void ValidateMapping(IdentityClaimRoleMappingDocument mapping)
    {
        IdentityClaimRoleMappingValidator.ValidateOrThrow(mapping);
    }
}
