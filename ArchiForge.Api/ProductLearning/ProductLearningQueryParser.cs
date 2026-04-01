using System.Globalization;

namespace ArchiForge.Api.ProductLearning;

/// <summary>Parses and validates shared query parameters for product-learning GET endpoints.</summary>
internal static class ProductLearningQueryParser
{
    public const int DefaultMaxImprovementOpportunities = 12;

    public const int MinMaxImprovementOpportunities = 1;

    public const int MaxMaxImprovementOpportunities = 50;

    public const int DefaultMaxTriageQueueItems = 25;

    public const int MinMaxTriageQueueItems = 1;

    public const int MaxMaxTriageQueueItems = 100;

    /// <summary>Empty or whitespace <paramref name="since"/> yields <c>null</c> (all time).</summary>
    public static bool TryParseOptionalSince(string? since, out DateTime? sinceUtc, out string? error)
    {
        sinceUtc = null;
        error = null;

        if (string.IsNullOrWhiteSpace(since))
        {
            return true;
        }

        if (!DateTimeOffset.TryParse(
                since,
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind | DateTimeStyles.AssumeUniversal,
                out DateTimeOffset parsed))
        {
            error = "Query parameter 'since' must be a valid ISO 8601 date-time (use UTC or include offset).";
            return false;
        }

        sinceUtc = parsed.UtcDateTime;
        return true;
    }

    public static bool TryParseMaxImprovementOpportunities(string? raw, out int value, out string? error) =>
        TryParseBoundedInt(
            raw,
            DefaultMaxImprovementOpportunities,
            MinMaxImprovementOpportunities,
            MaxMaxImprovementOpportunities,
            "maxOpportunities",
            out value,
            out error);

    public static bool TryParseMaxTriageQueueItems(string? raw, out int value, out string? error) =>
        TryParseBoundedInt(
            raw,
            DefaultMaxTriageQueueItems,
            MinMaxTriageQueueItems,
            MaxMaxTriageQueueItems,
            "maxTriageItems",
            out value,
            out error);

    private static bool TryParseBoundedInt(
        string? raw,
        int defaultValue,
        int min,
        int max,
        string paramName,
        out int value,
        out string? error)
    {
        error = null;

        if (string.IsNullOrWhiteSpace(raw))
        {
            value = defaultValue;
            return true;
        }

        if (!int.TryParse(raw, NumberStyles.None, CultureInfo.InvariantCulture, out int parsed))
        {
            value = default;
            error = $"Query parameter '{paramName}' must be an integer.";
            return false;
        }

        if (parsed < min || parsed > max)
        {
            value = default;
            error = $"Query parameter '{paramName}' must be between {min} and {max}.";
            return false;
        }

        value = parsed;
        return true;
    }
}
