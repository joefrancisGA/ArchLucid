using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>
///     Confirmable structured brief fields on an architecture draft (TB-2282).
///     Maps onto <see cref="Requests.ArchitectureRequest" /> lists at review start.
/// </summary>
public sealed class ArchitectureDraftStructuredBrief
{
    /// <summary>Explicit unknown sentinel — silence is not treated as “none.”</summary>
    public const string UnknownConfirmBeforeReview = "Unknown — confirm before review";

    /// <summary>TB-2343: unknown placeholders are not confirmed facts for readiness or graph projection.</summary>
    public static bool IsUnknownConfirmSentinel(string? value) =>
        !string.IsNullOrWhiteSpace(value)
        && string.Equals(
            NormalizeUnknownSentinelKey(value),
            NormalizeUnknownSentinelKey(UnknownConfirmBeforeReview),
            StringComparison.Ordinal);

    private static string NormalizeUnknownSentinelKey(string value) =>
        value.Trim()
            .Replace('\u2014', '-')
            .Replace('\u2013', '-')
            .ToLowerInvariant();

    /// <summary>TB-2343: non-empty brief list entries that are not the unknown sentinel.</summary>
    public static bool IsConfirmedBriefEntry(string? value) =>
        !string.IsNullOrWhiteSpace(value) && !IsUnknownConfirmSentinel(value);

    [JsonPropertyName("confirmedConstraints")]
    public List<string> ConfirmedConstraints
    {
        get;
        set;
    } = [];

    [JsonPropertyName("confirmedAssumptions")]
    public List<string> ConfirmedAssumptions
    {
        get;
        set;
    } = [];

    [JsonPropertyName("confirmedRequiredCapabilities")]
    public List<string> ConfirmedRequiredCapabilities
    {
        get;
        set;
    } = [];

    [JsonPropertyName("suggestedConstraints")]
    public List<string> SuggestedConstraints
    {
        get;
        set;
    } = [];

    [JsonPropertyName("suggestedAssumptions")]
    public List<string> SuggestedAssumptions
    {
        get;
        set;
    } = [];

    [JsonPropertyName("suggestedRequiredCapabilities")]
    public List<string> SuggestedRequiredCapabilities
    {
        get;
        set;
    } = [];

    [JsonPropertyName("deniedConstraints")]
    public List<string> DeniedConstraints
    {
        get;
        set;
    } = [];

    [JsonPropertyName("deniedAssumptions")]
    public List<string> DeniedAssumptions
    {
        get;
        set;
    } = [];

    [JsonPropertyName("deniedRequiredCapabilities")]
    public List<string> DeniedRequiredCapabilities
    {
        get;
        set;
    } = [];

    /// <summary>RTO/RPO, latency, volume, cost ceiling, or qualitative targets such as defense in depth.</summary>
    [JsonPropertyName("qualityAttribute")]
    public string? QualityAttribute
    {
        get;
        set;
    }

    /// <summary>Splits a stored quality-attribute string into chip entries (semicolon-delimited).</summary>
    public static IReadOnlyList<string> ParseQualityAttributeEntries(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return [];

        return value
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(entry => entry.Length > 0)
            .ToList();
    }

    /// <summary>TB-2282: at least one confirmed quality-attribute chip is required for review start.</summary>
    public static bool QualityAttributeMeetsMinimum(string? qualityAttribute)
    {
        foreach (string entry in ParseQualityAttributeEntries(qualityAttribute))
        {
            if (IsConfirmedBriefEntry(entry))
                return true;
        }

        return false;
    }

    [JsonPropertyName("failureModeNote")]
    public string? FailureModeNote
    {
        get;
        set;
    }

    [JsonPropertyName("suggestedFailureModeNote")]
    public string? SuggestedFailureModeNote
    {
        get;
        set;
    }

    [JsonPropertyName("deniedFailureModeNote")]
    public string? DeniedFailureModeNote
    {
        get;
        set;
    }

    [JsonPropertyName("operationalOwner")]
    public string? OperationalOwner
    {
        get;
        set;
    }
}
