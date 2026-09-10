using ArchLucid.Contracts.Risk;

namespace ArchLucid.Decisioning.Risk;

internal static class WafPillarIntakeKeys
{
    public static string ToL0QuestionKey(WafPillar pillar) =>
        pillar switch
        {
            WafPillar.Reliability => "l0.pillar.reliability",
            WafPillar.Security => "l0.pillar.security",
            WafPillar.Cost => "l0.pillar.cost",
            WafPillar.Operations => "l0.pillar.operations",
            WafPillar.Performance => "l0.pillar.performance",
            _ => throw new ArgumentOutOfRangeException(nameof(pillar), pillar, "Unknown WAF pillar."),
        };
}
