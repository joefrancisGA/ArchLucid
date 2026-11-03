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
            .Select(priority => NormalizePriorityToken(priority.Trim()))
            .GroupBy(priority => priority, StringComparer.Ordinal)
            .Select(group => group.First())
            .ToList();
    }

    // Preserve the user's priority labels for downstream presentation, while grouping
    // and ordering by the same case-insensitive canonical key used for cache identity.
    // The existing Normalize() continues to produce stable fingerprint inputs.
    public static List<string> NormalizeForDisplay(IEnumerable<string> priorities)
    {
        ArgumentNullException.ThrowIfNull(priorities);

        return priorities
            .Where(priority => !string.IsNullOrWhiteSpace(priority))
            .Select(priority => NormalizeUnicode(priority.Trim()))
            .Select(priority => (
                Display: priority.Contains('/') || priority.Contains('\\')
                    ? GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(priority)
                    : priority,
                Key: NormalizePriorityToken(priority)))
            .GroupBy(priority => priority.Key, StringComparer.Ordinal)
            .Select(group => group.First().Display)
            .ToList();
    }

    // Path canonicalization cuts at '#' and '?'. Numbered prose such as "priority #1: Cost over Security"
    // is not a path, so that cut dropped the explicit pair. Slash-shaped priorities still canonicalize.
    private static string NormalizePriorityToken(string priority)
    {
        string lowered = NormalizeUnicode(priority).ToLowerInvariant();

        if (lowered.Contains('/') || lowered.Contains('\\'))
            return GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(lowered);

        return lowered;
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
