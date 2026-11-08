using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopModelAliasIdNormalizer
{
    public static string NormalizeRequired(string modelAliasId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(modelAliasId);

        return modelAliasId.Trim();
    }

    public static string? NormalizeOptional(string? modelAliasId)
    {
        if (string.IsNullOrWhiteSpace(modelAliasId))
            return null;

        return modelAliasId.Trim();
    }

    public static string NormalizeForHash(string? modelAliasId)
    {
        if (string.IsNullOrWhiteSpace(modelAliasId))
            return string.Empty;

        string normalized = CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(modelAliasId.Trim()));

        return GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(normalized.ToLowerInvariant());
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
