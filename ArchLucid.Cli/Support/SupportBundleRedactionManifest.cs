using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Support;

public sealed class SupportBundleRedactionManifest
{
    [JsonPropertyName("formatVersion")]
    public string FormatVersion
    {
        get;
        init;
    } = "1.0";

    [JsonPropertyName("generatedUtc")]
    public string GeneratedUtc
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("status")]
    public string Status
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("redactionPassAppliedToSerializedSections")]
    public bool RedactionPassAppliedToSerializedSections
    {
        get;
        init;
    }

    [JsonPropertyName("rulesApplied")]
    public IReadOnlyList<string> RulesApplied
    {
        get;
        init;
    } = [];

    [JsonPropertyName("filesCovered")]
    public IReadOnlyList<string> FilesCovered
    {
        get;
        init;
    } = [];

    [JsonPropertyName("omittedSecretBearingCategories")]
    public IReadOnlyList<string> OmittedSecretBearingCategories
    {
        get;
        init;
    } = [];

    [JsonPropertyName("secretDetectionStatus")]
    public string SecretDetectionStatus
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("evidenceClaim")]
    public string EvidenceClaim
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("limitations")]
    public IReadOnlyList<string> Limitations
    {
        get;
        init;
    } = [];

    [JsonPropertyName("reviewerInstructions")]
    public IReadOnlyList<string> ReviewerInstructions
    {
        get;
        init;
    } = [];

    [JsonPropertyName("fileIntegrity")]
    public IReadOnlyList<BuyerSafeArtifactIntegrityEntry> FileIntegrity
    {
        get;
        init;
    } = [];
}
