using System.Text;

using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopDeclaredPrioritiesNormalizer
{
    public static List<string> Normalize(IEnumerable<string> priorities)
    {
        ArgumentNullException.ThrowIfNull(priorities);

        // Encounter order is trade-off precedence: the last explicit pair wins. Alphabetical
        // sort made "Security over Cost" then "Cost over Security" resolve security-first.
        return priorities
            .Where(priority => !string.IsNullOrWhiteSpace(priority))
            .Select(priority => NormalizeUnicode(priority.Trim()))
            .Select(priority => GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(priority.ToLowerInvariant()))
            .GroupBy(priority => priority, StringComparer.Ordinal)
            .Select(group => group.First())
            .ToList();
    }

    private static string NormalizeUnicode(string value)
    {
        if (value.Length == 0)
            return value;

        return CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(value)).Normalize(NormalizationForm.FormC);
    }

    private static string NormalizeUnicodeSpaces(string value) =>
        value
            .Replace('\u00a0', ' ')
            .Replace('\u202f', ' ');

    private static string CollapseInteriorAsciiSpaces(string content)
    {
        while (content.Contains("  ", StringComparison.Ordinal))
            content = content.Replace("  ", " ", StringComparison.Ordinal);

        return content;
    }
}
