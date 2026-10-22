using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Canonicalizes tenant/workspace/project scope ids for review-cache manifest hashing.
/// </summary>
internal static class ClosedLoopScopeIdHashNormalizer
{
    public static string Normalize(string? scopeId)
    {
        if (string.IsNullOrWhiteSpace(scopeId))
            return string.Empty;

        string trimmed = CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(scopeId.Trim()));

        if (Guid.TryParse(trimmed, out Guid guid))
            return guid.ToString("D").ToLowerInvariant();

        return GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(trimmed.ToLowerInvariant());
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
