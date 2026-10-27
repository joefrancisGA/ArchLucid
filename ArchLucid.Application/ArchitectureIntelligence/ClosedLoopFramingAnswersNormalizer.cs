using System.Text;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopFramingAnswersNormalizer
{
    public static Dictionary<string, string> Normalize(IReadOnlyDictionary<string, string> framingAnswers)
    {
        ArgumentNullException.ThrowIfNull(framingAnswers);

        List<KeyValuePair<string, string>> pairs = [];

        foreach (KeyValuePair<string, string> pair in framingAnswers)
        {
            if (string.IsNullOrWhiteSpace(pair.Key))
                continue;

            pairs.Add(
                new KeyValuePair<string, string>(
                    NormalizeFramingKey(pair.Key),
                    NormalizeFramingValue(pair.Value)));
        }

        Dictionary<string, string> normalized = new(StringComparer.Ordinal);

        foreach (IGrouping<string, KeyValuePair<string, string>> group in pairs
                     .GroupBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                     .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase))
        {
            KeyValuePair<string, string> canonical = group
                .Where(pair => !string.IsNullOrEmpty(pair.Value))
                .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                .DefaultIfEmpty()
                .First();

            if (string.IsNullOrEmpty(canonical.Key))
                continue;

            normalized[canonical.Key] = canonical.Value;
        }

        return normalized;
    }

    private static string NormalizeFramingKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return string.Empty;

        string normalized = NormalizeUnicode(key.Trim());

        if (normalized.Length == 0)
            return normalized;

        return GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(normalized);
    }

    private static string NormalizeFramingValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string normalized = NormalizeUnicode(value.Trim());

        if (normalized.Length == 0)
            return normalized;

        return GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(normalized.ToLowerInvariant());
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
