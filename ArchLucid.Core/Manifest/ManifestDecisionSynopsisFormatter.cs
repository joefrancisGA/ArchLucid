namespace ArchLucid.Core.Manifest;

/// <summary>
///     Builds operator-facing one-line decision excerpts for manifest summary surfaces (BDA-146).
/// </summary>
public static class ManifestDecisionSynopsisFormatter
{
    public const int DefaultMaxSynopses = 3;

    public const int MaxSynopsisLength = 200;

    /// <summary>Returns up to <paramref name="maxCount" /> synopsis lines for manifest summary cards.</summary>
    public static IReadOnlyList<string> FormatTopSynopses(
        IEnumerable<ResolvedArchitectureDecision> decisions,
        int maxCount = DefaultMaxSynopses)
    {
        if (decisions is null)
            throw new ArgumentNullException(nameof(decisions));

        if (maxCount <= 0)
            return [];

        List<string> synopses = [];

        foreach (ResolvedArchitectureDecision decision in decisions)
        {
            if (synopses.Count >= maxCount)
                break;

            if (!HasMeaningfulContent(decision))
                continue;

            string synopsis = FormatSynopsis(decision);

            if (string.IsNullOrWhiteSpace(synopsis))
                continue;

            synopses.Add(synopsis);
        }

        return synopses;
    }

    /// <summary>Single-line synopsis from title/option, else rationale, else category.</summary>
    public static string FormatSynopsis(ResolvedArchitectureDecision decision)
    {
        if (decision is null)
            throw new ArgumentNullException(nameof(decision));

        string title = decision.Title?.Trim() ?? string.Empty;
        string option = decision.SelectedOption?.Trim() ?? string.Empty;

        if (title.Length > 0 && option.Length > 0)
            return Truncate($"{title}: {option}");

        if (title.Length > 0)
            return Truncate(title);

        string rationale = decision.Rationale?.Trim() ?? string.Empty;

        if (rationale.Length > 0)
            return Truncate(rationale);

        string category = decision.Category?.Trim() ?? string.Empty;

        if (category.Length > 0)
            return Truncate(category);

        return "Architecture decision";
    }

    private static bool HasMeaningfulContent(ResolvedArchitectureDecision decision)
    {
        return !string.IsNullOrWhiteSpace(decision.Title)
            || !string.IsNullOrWhiteSpace(decision.SelectedOption)
            || !string.IsNullOrWhiteSpace(decision.Rationale)
            || !string.IsNullOrWhiteSpace(decision.Category);
    }

    private static string Truncate(string value)
    {
        if (value.Length <= MaxSynopsisLength)
            return value;

        return value[..(MaxSynopsisLength - 1)].TrimEnd() + "…";
    }
}
