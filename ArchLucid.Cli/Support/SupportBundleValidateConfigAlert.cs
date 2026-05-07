using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Support;

/// <summary>
///     Warning or error row from the same rules as <c>archlucid validate-config</c> (no secret values).
/// </summary>
public sealed class SupportBundleValidateConfigAlert
{
    [JsonPropertyName("severity")]
    public string Severity
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("category")]
    public string Category
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("check")]
    public string Check
    {
        get;
        init;
    } = string.Empty;
}
