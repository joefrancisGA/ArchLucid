using System.Text.Json.Serialization;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

internal sealed class CuratedRulesRuleEntry
{
    [JsonPropertyName("id")]
    public string? Id
    {
        get;
        set;
    }

    [JsonPropertyName("title")]
    public string? Title
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

    [JsonPropertyName("severity")]
    public string? Severity
    {
        get;
        set;
    }

    [JsonPropertyName("remediationGuidance")]
    public string? RemediationGuidance
    {
        get;
        set;
    }

    [JsonPropertyName("evidenceHints")]
    public List<string>? EvidenceHints
    {
        get;
        set;
    }

    [JsonPropertyName("frameworkMappings")]
    public List<CuratedRulesFrameworkMappingEntry>? FrameworkMappings
    {
        get;
        set;
    }
}
