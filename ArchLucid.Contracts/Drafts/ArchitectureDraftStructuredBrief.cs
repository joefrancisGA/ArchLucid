using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

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

    private List<string> confirmedConstraints = [];

    [JsonPropertyName("confirmedConstraints")]
    public List<string> ConfirmedConstraints
    {
        get => confirmedConstraints;
        set => confirmedConstraints = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> confirmedAssumptions = [];

    [JsonPropertyName("confirmedAssumptions")]
    public List<string> ConfirmedAssumptions
    {
        get => confirmedAssumptions;
        set => confirmedAssumptions = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> confirmedRequiredCapabilities = [];

    [JsonPropertyName("confirmedRequiredCapabilities")]
    public List<string> ConfirmedRequiredCapabilities
    {
        get => confirmedRequiredCapabilities;
        set => confirmedRequiredCapabilities = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Inherited inline requirements from a prior package (TB-2350).</summary>
    private List<string> confirmedInlineRequirements = [];

    [JsonPropertyName("confirmedInlineRequirements")]
    public List<string> ConfirmedInlineRequirements
    {
        get => confirmedInlineRequirements;
        set => confirmedInlineRequirements = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> suggestedConstraints = [];

    [JsonPropertyName("suggestedConstraints")]
    public List<string> SuggestedConstraints
    {
        get => suggestedConstraints;
        set => suggestedConstraints = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> suggestedAssumptions = [];

    [JsonPropertyName("suggestedAssumptions")]
    public List<string> SuggestedAssumptions
    {
        get => suggestedAssumptions;
        set => suggestedAssumptions = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> suggestedRequiredCapabilities = [];

    [JsonPropertyName("suggestedRequiredCapabilities")]
    public List<string> SuggestedRequiredCapabilities
    {
        get => suggestedRequiredCapabilities;
        set => suggestedRequiredCapabilities = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> deniedConstraints = [];

    [JsonPropertyName("deniedConstraints")]
    public List<string> DeniedConstraints
    {
        get => deniedConstraints;
        set => deniedConstraints = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> deniedAssumptions = [];

    [JsonPropertyName("deniedAssumptions")]
    public List<string> DeniedAssumptions
    {
        get => deniedAssumptions;
        set => deniedAssumptions = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> deniedRequiredCapabilities = [];

    [JsonPropertyName("deniedRequiredCapabilities")]
    public List<string> DeniedRequiredCapabilities
    {
        get => deniedRequiredCapabilities;
        set => deniedRequiredCapabilities = ContractCollectionDefaults.Coalesce(value);
    }

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
            .Split([';', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(entry => entry.Length > 0)
            .ToList();
    }

    /// <summary>TB-2282: quality-attribute chips must be non-empty and all entries must be confirmed for review start.</summary>
    public static bool QualityAttributeMeetsMinimum(string? qualityAttribute)
    {
        IReadOnlyList<string> entries = ParseQualityAttributeEntries(qualityAttribute);

        if (entries.Count == 0)
            return false;

        foreach (string entry in entries)
        {

            if (!IsConfirmedBriefEntry(entry))
                return false;
        }

        return true;
    }

    /// <summary>TB-2343: non-empty list whose entries are exclusively unknown sentinels.</summary>
    public static bool ListIsOnlyUnknownPlaceholders(IReadOnlyList<string> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        return entries.Count > 0 && entries.All(IsUnknownConfirmSentinel);
    }

    /// <summary>TB-2343: quality attribute populated only with unknown sentinel chips.</summary>
    public static bool QualityAttributeIsOnlyUnknownPlaceholder(string? qualityAttribute)
    {
        IReadOnlyList<string> entries = ParseQualityAttributeEntries(qualityAttribute);

        return entries.Count > 0 && entries.All(IsUnknownConfirmSentinel);
    }

    /// <summary>TB-2343: structured brief still contains explicit unknown placeholders that must be confirmed.</summary>
    public static bool HasUnconfirmedStructuredBriefPlaceholders(ArchitectureDraftStructuredBrief brief)
    {
        ArgumentNullException.ThrowIfNull(brief);

        if (ListIsOnlyUnknownPlaceholders(brief.ConfirmedConstraints))
            return true;

        if (ListIsOnlyUnknownPlaceholders(brief.ConfirmedAssumptions))
            return true;

        if (ListIsOnlyUnknownPlaceholders(brief.ConfirmedRequiredCapabilities))
            return true;

        if (QualityAttributeIsOnlyUnknownPlaceholder(brief.QualityAttribute))
            return true;

        if (IsUnknownConfirmSentinel(brief.FailureModeNote))
            return true;

        if (IsUnknownConfirmSentinel(brief.OperationalOwner))
            return true;

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
