using System.Text.Json.Serialization;

namespace ArchLucid.Core.Support;

/// <summary>
///     One machine-readable triage hint for tooling or support dashboards.
/// </summary>
public sealed class SupportBundleNextStepHint
{
    [JsonPropertyName("id")]
    public string Id
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Suggested values: action, warning, info.</summary>
    [JsonPropertyName("severity")]
    public string Severity
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("message")]
    public string Message
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("docReference")]
    public string DocReference
    {
        get;
        init;
    } = string.Empty;
}
