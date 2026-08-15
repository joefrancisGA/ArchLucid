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

    /// <summary>RTO/RPO, latency, volume, or cost ceiling — must include a numeric value when set.</summary>
    [JsonPropertyName("qualityAttribute")]
    public string? QualityAttribute
    {
        get;
        set;
    }

    [JsonPropertyName("failureModeNote")]
    public string? FailureModeNote
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
