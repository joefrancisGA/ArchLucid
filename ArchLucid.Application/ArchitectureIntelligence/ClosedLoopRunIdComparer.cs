using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopRunIdComparer
{
    public static string Normalize(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string trimmed = CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(runId.Trim()));
        string pathCanonical = GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(trimmed.ToLowerInvariant());

        return pathCanonical.Replace("-", string.Empty, StringComparison.Ordinal);
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

    public static bool Equals(string left, string right)
    {
        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
            return false;

        return string.Equals(
            Normalize(left),
            Normalize(right),
            StringComparison.OrdinalIgnoreCase);
    }
}
