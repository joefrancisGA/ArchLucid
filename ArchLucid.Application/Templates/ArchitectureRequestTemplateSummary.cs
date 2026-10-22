using System.Text.Json.Serialization;

namespace ArchLucid.Application.Templates;

/// <summary>
///     Catalog metadata for a wizard-selectable architecture request template (read via
///     <c>GET /v1/architecture/templates</c>).
/// </summary>
public sealed record ArchitectureRequestTemplateSummary(string Id, string Name, string Description)
{
    [JsonPropertyName("id")]
    public string Id
    {
        get;
        init;
    } = Id ?? throw new ArgumentNullException(nameof(Id));

    [JsonPropertyName("name")]
    public string Name
    {
        get;
        init;
    } = Name ?? throw new ArgumentNullException(nameof(Name));

    [JsonPropertyName("description")]
    public string Description
    {
        get;
        init;
    } = Description ?? throw new ArgumentNullException(nameof(Description));
}
