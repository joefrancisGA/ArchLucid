using System.Text.Json.Serialization;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>JSON shape persisted in <c>dbo.AgentResults.ProposedEvidenceJson</c>.</summary>
public sealed class ProposedEvidencePayload
{
    [JsonPropertyName("type")]
    public string Type
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("title")]
    public string Title
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("description")]
    public string Description
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("rationale")]
    public string Rationale
    {
        get;
        set;
    } = string.Empty;
}
