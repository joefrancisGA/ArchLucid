using System.Text.Json.Serialization;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

internal sealed class CuratedRulesFrameworkMappingEntry
{
    [JsonPropertyName("framework")]
    public string? Framework
    {
        get;
        set;
    }

    [JsonPropertyName("control")]
    public string? Control
    {
        get;
        set;
    }

    [JsonPropertyName("requirement")]
    public string? Requirement
    {
        get;
        set;
    }
}
