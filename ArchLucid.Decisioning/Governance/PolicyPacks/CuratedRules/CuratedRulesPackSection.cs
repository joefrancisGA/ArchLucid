using System.Text.Json.Serialization;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

/// <summary>Envelope metadata inside a curated-rules V1 document (the JSON <c>pack</c> object).</summary>
internal sealed class CuratedRulesPackSection
{
    [JsonPropertyName("name")]
    public string? Name
    {
        get;
        set;
    }

    [JsonPropertyName("description")]
    public string? Description
    {
        get;
        set;
    }

    [JsonPropertyName("version")]
    public string? Version
    {
        get;
        set;
    }

    [JsonPropertyName("category")]
    public string? Category
    {
        get;
        set;
    }

    [JsonPropertyName("isDefault")]
    public bool? IsDefault
    {
        get;
        set;
    }

    [JsonPropertyName("suggestedPackType")]
    public string? SuggestedPackType
    {
        get;
        set;
    }

    [JsonPropertyName("policyPackContentDocumentPath")]
    public string? PolicyPackContentDocumentPath
    {
        get;
        set;
    }
}
