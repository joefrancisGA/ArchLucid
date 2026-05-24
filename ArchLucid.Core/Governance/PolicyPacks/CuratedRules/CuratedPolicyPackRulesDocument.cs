using System.Text.Json.Serialization;

namespace ArchLucid.Core.Governance.PolicyPacks.CuratedRules;

internal sealed class CuratedPolicyPackRulesDocument
{
    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion
    {
        get;
        set;
    }

    [JsonPropertyName("kind")]
    public string? Kind
    {
        get;
        set;
    }

    [JsonPropertyName("pack")]
    public CuratedRulesPackSection? Pack
    {
        get;
        set;
    }

    [JsonPropertyName("rules")]
    public List<CuratedRulesRuleEntry>? Rules
    {
        get;
        set;
    }
}
