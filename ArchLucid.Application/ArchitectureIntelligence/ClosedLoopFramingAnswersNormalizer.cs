using System.Text;

using ArchLucid.Contracts.ArchitectureIntelligence;

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
                    NormalizeUnicode(pair.Key.Trim()),
                    NormalizeUnicode(pair.Value?.Trim() ?? string.Empty)));
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

    private static string NormalizeUnicode(string value) =>
        value.Length == 0 ? value : value.Normalize(NormalizationForm.FormC);
}
