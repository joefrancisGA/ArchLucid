using System.Text.Json.Serialization;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

internal sealed class CuratedRulesApplicabilityConditions
{
    [JsonPropertyName("cloudProvider")]
    public List<string>? CloudProvider
    {
        get;
        set;
    }
}
