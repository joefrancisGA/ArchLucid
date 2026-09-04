using System.Text.Json.Serialization;

namespace ArchLucid.Core.Governance.PolicyPacks.CuratedRules;

internal sealed class CuratedRulesApplicabilityConditions
{
    [JsonPropertyName("cloudProvider")]
    public List<string>? CloudProvider
    {
        get;
        set;
    }
}
