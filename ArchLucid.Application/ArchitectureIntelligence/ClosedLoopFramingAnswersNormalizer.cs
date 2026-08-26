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

            pairs.Add(new KeyValuePair<string, string>(pair.Key.Trim(), pair.Value?.Trim() ?? string.Empty));
        }

        Dictionary<string, string> normalized = new(StringComparer.Ordinal);

        foreach (IGrouping<string, KeyValuePair<string, string>> group in pairs
                     .GroupBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                     .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase))
        {
            KeyValuePair<string, string> canonical = group
                .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                .First();

            normalized[canonical.Key] = canonical.Value;
        }

        return normalized;
    }
}
