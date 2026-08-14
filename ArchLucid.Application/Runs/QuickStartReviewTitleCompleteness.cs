using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Quick start review-title quality gate (TB-2297) — mirrors
///     <c>archlucid-ui/src/lib/first-pilot-review-title-quality.ts</c>.
/// </summary>
public static class QuickStartReviewTitleCompleteness
{
    public const string QualityExample = "Retail API modernization review";

    private static readonly HashSet<string> BannedActivityTitles = new(StringComparer.OrdinalIgnoreCase)
    {
        "architecture review",
        "test review",
        "untitled",
        "weekly review",
        "test",
        "demo",
        "tmp",
    };

    private static readonly string[] DecisionTokens =
    [
        "modernization",
        "modernise",
        "modernize",
        "retire",
        "replace",
        "migrate",
        "migration",
        "upgrade",
        "decommission",
        "expand",
        "consolidate",
        "move",
        "add ",
    ];

    /// <summary>
    ///     Adds a validation failure when Quick start <see cref="ArchitectureRequest.SystemName"/> is a placeholder
    ///     or does not name a system and a decision.
    /// </summary>
    public static bool TryCollectFailures(ArchitectureRequest request, IList<FluentValidation.Results.ValidationFailure> failures)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(failures);

        if (!QuickStartIntakeRequestEnricher.RequiresL0MustSet(request))
        {
            return false;
        }

        if (IsAcceptable(request.SystemName))
        {
            return false;
        }

        failures.Add(
            new FluentValidation.Results.ValidationFailure(
                nameof(ArchitectureRequest.SystemName),
                "Quick start requires a review title that names the system and the decision, "
                + $"for example “{QualityExample}”. Placeholder titles such as “Architecture review” or “Test review” are not accepted."));

        return true;
    }

    internal static bool IsAcceptable(string? title)
    {
        string normalized = NormalizeTitle(title);

        if (normalized.Length == 0)
        {
            return false;
        }

        if (IsUnusableCandidate(normalized))
        {
            return false;
        }

        if (BannedActivityTitles.Contains(normalized))
        {
            return false;
        }

        return HasSystemAndDecision(normalized);
    }

    private static string NormalizeTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return string.Empty;
        }

        return string.Join(" ", title.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }

    private static bool IsUnusableCandidate(string normalized)
    {
        return !normalized.Any(char.IsLetter);
    }

    private static bool HasSystemAndDecision(string normalized)
    {
        string[] parts = normalized
            .Split([" — ", " – ", " : ", " - ", ": "], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(static part => part.Length > 0)
            .ToArray();

        if (parts.Length >= 2)
        {
            return true;
        }

        string lower = normalized.ToLowerInvariant();

        return DecisionTokens.Any(token => lower.Contains(token, StringComparison.Ordinal));
    }
}
