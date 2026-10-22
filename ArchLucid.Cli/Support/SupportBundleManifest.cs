using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Support;

public sealed class SupportBundleManifest
{
    [JsonPropertyName("bundleFormatVersion")]
    public string BundleFormatVersion
    {
        get;
        init;
    } = "1.4";

    [JsonPropertyName("createdUtc")]
    public string CreatedUtc
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("cliWorkingDirectory")]
    public string CliWorkingDirectory
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Expected <c>archlucid.json</c> path for this collection (may be absent).</summary>
    [JsonPropertyName("archlucidJsonPath")]
    public string ArchLucidJsonPath
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("archlucidJsonPresent")]
    public bool ArchLucidJsonPresent
    {
        get;
        init;
    }

    /// <summary>Suggested file open order for first-line triage (mirrors <c>README.txt</c>).</summary>
    [JsonPropertyName("triageReadOrder")]
    public IReadOnlyList<SupportBundleTriageEntry> TriageReadOrder
    {
        get;
        init;
    } = [];

    [JsonPropertyName("notes")]
    public string Notes
    {
        get;
        init;
    } =
        "No secrets, connection strings, or API key values are included. Sensitive env vars appear only as (set)/(not set).";

    /// <summary>Bundle member file names at this bundle root, lexicographically sorted for deterministic manifests.</summary>
    [JsonPropertyName("includedFilesLexOrder")]
    public IReadOnlyList<string> IncludedFilesLexOrder
    {
        get;
        init;
    } = [];

    /// <summary>When <see langword="true" />, <see cref="SupportBundleArchiveWriter.WriteDirectoryWithRedaction" /> ran the text pass over serialized JSON/readme.</summary>
    [JsonPropertyName("redactionPassAppliedToSerializedSections")]
    public bool RedactionPassAppliedToSerializedSections
    {
        get;
        init;
    }

    /// <summary>Dedicated redaction evidence artifact path inside the support bundle.</summary>
    [JsonPropertyName("redactionManifestPath")]
    public string RedactionManifestPath
    {
        get;
        init;
    } = SupportBundleArchiveWriter.RedactionManifestFileName;

    /// <summary>Logical redaction rules applied to text (see <see cref="SupportBundleRedactor.TextPatternRedactionRules" />).</summary>
    [JsonPropertyName("redactionRulesApplied")]
    public IReadOnlyList<string> RedactionRulesApplied
    {
        get;
        init;
    } = [];
}
