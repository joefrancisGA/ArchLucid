using System.Text.Json.Serialization;

namespace ArchLucid.Core.Governance.PolicyPacks.CuratedRules;

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
