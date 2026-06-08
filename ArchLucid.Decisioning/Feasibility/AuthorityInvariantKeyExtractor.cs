using System.Text.RegularExpressions;

namespace ArchLucid.Decisioning.Feasibility;

/// <summary>
///     Extracts <c>INV-*</c> catalog keys from free text surfaced by the authority pipeline.
/// </summary>
public static partial class AuthorityInvariantKeyExtractor
{
    [GeneratedRegex(@"\bINV-\d{3}\b", RegexOptions.CultureInvariant)]
    private static partial Regex InvariantKeyPattern();

    public static List<string> ExtractDistinctInvariantKeys(params string?[] textSegments)
    {
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        if (textSegments is null)
            return [];

        foreach (string? segment in textSegments)
        {
            if (string.IsNullOrWhiteSpace(segment))
                continue;

            foreach (Match match in InvariantKeyPattern().Matches(segment))
            {
                string key = match.Value;

                if (FeasibilityInvariantCatalog.IsValidInvariantKey(key))
                    keys.Add(key);
            }
        }

        return keys.OrderBy(static key => key, StringComparer.OrdinalIgnoreCase).ToList();
    }
}
