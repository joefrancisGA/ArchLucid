using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Optional approved-pattern hint for a cut point — deterministic; conflicts fail closed.</summary>
public static class SecurityEvidenceCutPointPatternSuggester
{
    public static string? TrySuggestPatternKey(
        SecurityEvidenceCutPointCandidate candidate,
        IReadOnlyList<RemediationPatternApprovedVersionRecord> approvedVersions)
    {
        ArgumentNullException.ThrowIfNull(candidate);
        ArgumentNullException.ThrowIfNull(approvedVersions);

        if (string.IsNullOrWhiteSpace(candidate.ResourceType))
        {
            return null;
        }

        List<RemediationPatternApprovedVersionRecord> matches = approvedVersions
            .Where(version =>
                !string.IsNullOrWhiteSpace(version.Version.MatchResourceType)
                && string.Equals(
                    version.Version.MatchResourceType,
                    candidate.ResourceType,
                    StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (matches.Count == 0)
        {
            return null;
        }

        List<string> distinctPatternKeys = matches
            .Select(match => match.Pattern.PatternKey)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(key => key, StringComparer.Ordinal)
            .ToList();

        if (distinctPatternKeys.Count != 1)
        {
            return null;
        }

        return distinctPatternKeys[0];
    }
}
