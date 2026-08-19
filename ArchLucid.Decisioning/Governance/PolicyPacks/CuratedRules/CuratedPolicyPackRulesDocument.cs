using System.Text.Json.Serialization;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

/// <summary>
///     Root JSON shape for <see cref="PolicyPackCuratedRulesMetadataKey.V1" /> metadata (matches
///     <c>docs/samples/policy-packs/*-rules-v1.json</c> ).
/// </summary>
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
