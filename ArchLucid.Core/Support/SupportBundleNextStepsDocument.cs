using System.Text.Json.Serialization;

namespace ArchLucid.Core.Support;

/// <summary>
///     Serialized as <see cref="SupportBundleLayout.NextStepsFileName" /> inside support bundles.
/// </summary>
public sealed class SupportBundleNextStepsDocument
{
    public const string AdvisoryDisclaimer =
        "Advisory only — confirm against health probes, OpenAPI output, and docs before acting.";

    [JsonPropertyName("schemaVersion")]
    public string SchemaVersion
    {
        get;
        init;
    } = "1.0";

    [JsonPropertyName("source")]
    public string Source
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("generatedUtc")]
    public string GeneratedUtc
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("disclaimer")]
    public string Disclaimer
    {
        get;
        init;
    } = AdvisoryDisclaimer;

    [JsonPropertyName("summaryLines")]
    public IReadOnlyList<string> SummaryLines
    {
        get;
        init;
    } = [];

    [JsonPropertyName("hints")]
    public IReadOnlyList<SupportBundleNextStepHint> Hints
    {
        get;
        init;
    } = [];
}
