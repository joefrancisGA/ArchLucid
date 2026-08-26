using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopFramingAnswersNormalizer
{
    public static Dictionary<string, string> Normalize(IReadOnlyDictionary<string, string> framingAnswers)
    {
        ArgumentNullException.ThrowIfNull(framingAnswers);

        Dictionary<string, string> normalized = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, string> pair in framingAnswers)
        {
            if (string.IsNullOrWhiteSpace(pair.Key))
                continue;

            string key = pair.Key.Trim();
            string value = pair.Value?.Trim() ?? string.Empty;

            normalized[key] = value;
        }

        return normalized;
    }
}
