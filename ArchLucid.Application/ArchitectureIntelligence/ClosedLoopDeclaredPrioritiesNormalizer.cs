using System.Text;

using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopDeclaredPrioritiesNormalizer
{
    public static List<string> Normalize(IEnumerable<string> priorities)
    {
        ArgumentNullException.ThrowIfNull(priorities);

        return priorities
            .Where(priority => !string.IsNullOrWhiteSpace(priority))
            .Select(priority => NormalizeUnicode(priority.Trim()))
            .Select(priority => GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(priority.ToLowerInvariant()))
            .GroupBy(priority => priority, StringComparer.Ordinal)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
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
                Display: GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(priority),
                Key: GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(priority.ToLowerInvariant())))
            .GroupBy(priority => priority.Key, StringComparer.Ordinal)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
            .Select(group => group.First().Display)
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
