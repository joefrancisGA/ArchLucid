using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;

namespace ArchLucid.Retrieval.PolicyPacks;

/// <summary>
///     Maps architecture agents to provider-neutral quality dimensions and retrieval framing
///     so topology/cost narratives align with policy-pack rules evaluated at findings time.
/// </summary>
public static class AgentPolicyPackRetrievalProfiles
{
    /// <summary>Quality dimensions whose pack rules should ground the given agent prompt.</summary>
    public static IReadOnlyList<QualityDimension> ResolveTargetDimensions(AgentType agentType) =>
        agentType switch
        {
            AgentType.Compliance =>
            [
                QualityDimension.Security,
            ],
            AgentType.Topology =>
            [
                QualityDimension.ReliabilityAndResilience,
                QualityDimension.PerformanceAndScalability,
                QualityDimension.OperationalExcellence,
                QualityDimension.SustainabilityAndResourceEfficiency,
            ],
            AgentType.Cost =>
            [
                QualityDimension.CostEffectiveness,
            ],
            _ => [],
        };

    /// <summary>Extra query terms appended to the architecture request embedding text.</summary>
    public static string BuildDimensionQuerySuffix(AgentType agentType) =>
        agentType switch
        {
            AgentType.Compliance =>
                " security compliance controls encryption identity governance",
            AgentType.Topology =>
                " reliability resilience performance scalability operational excellence sustainability redundancy availability",
            AgentType.Cost =>
                " cost optimization FinOps budget showback chargeback right-sizing waste",
            _ => string.Empty,
        };

    /// <summary>Prompt block heading shown above retrieved policy-pack hits.</summary>
    public static string ResolveBlockTitle(AgentType agentType) =>
        agentType switch
        {
            AgentType.Compliance =>
                "Policy Pack Controls (retrieved — cite ruleId when referencing):",
            AgentType.Topology =>
                "Policy Pack Rules — Reliability / Performance (retrieved — cite ruleId when referencing):",
            AgentType.Cost =>
                "Policy Pack Rules — Cost / FinOps (retrieved — cite ruleId when referencing):",
            _ =>
                "Policy Pack Rules (retrieved — cite ruleId when referencing):",
        };

    /// <summary>Objective phrase used in grounding-missing guidance.</summary>
    public static string ResolveGroundingObjective(AgentType agentType) =>
        agentType switch
        {
            AgentType.Compliance => "compliance requirements",
            AgentType.Topology => "reliability, performance, and resilience requirements",
            AgentType.Cost => "cost and FinOps requirements",
            _ => "policy-pack requirements",
        };

    /// <summary>
    ///     When true, only packs with a matching <see cref="QualityDimension" /> (or compliance overlays
    ///     for <see cref="AgentType.Compliance" />) are eligible for corpus retrieval.
    /// </summary>
    public static bool UsesDimensionScopedPackFilter(AgentType agentType) =>
        agentType is AgentType.Topology or AgentType.Cost;

    /// <summary>Returns whether an assigned pack should be searched for the agent.</summary>
    public static bool IncludesPack(
        AgentType agentType,
        QualityDimension? packQualityDimension)
    {
        if (!UsesDimensionScopedPackFilter(agentType))
            return true;

        if (!packQualityDimension.HasValue)
            return false;

        IReadOnlyList<QualityDimension> targets = ResolveTargetDimensions(agentType);

        foreach (QualityDimension target in targets)
        {
            if (target == packQualityDimension.Value)
                return true;
        }

        return false;
    }
}
