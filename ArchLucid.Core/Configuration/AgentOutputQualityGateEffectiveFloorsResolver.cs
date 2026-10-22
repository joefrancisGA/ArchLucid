using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Configuration;

/// <summary>Resolves effective warn/reject floors after optional per-<see cref="AgentType" /> overrides.</summary>
public static class AgentOutputQualityGateEffectiveFloorsResolver
{
    /// <summary>Effective quality gate floors for one agent type.</summary>
    public sealed record EffectiveFloors(
        double StructuralWarnBelow,
        double StructuralRejectBelow,
        double SemanticWarnBelow,
        double SemanticRejectBelow);

    /// <summary>Returns global or per-agent effective floors for diagnostics and gate evaluation.</summary>
    public static EffectiveFloors Resolve(AgentOutputQualityGateOptions options, AgentType agentType)
    {
        ArgumentNullException.ThrowIfNull(options);

        double structuralWarn = options.StructuralWarnBelow;
        double semanticWarn = options.SemanticWarnBelow;
        double structuralReject = options.StructuralRejectBelow;
        double semanticReject = options.SemanticRejectBelow;

        if (options.PerAgentTypeFloors.TryGetValue(agentType.ToString(), out AgentTypeQualityFloors? floors))
        {
            if (floors.StructuralWarnBelow.HasValue)
                structuralWarn = floors.StructuralWarnBelow.Value;

            if (floors.StructuralRejectBelow.HasValue)
                structuralReject = floors.StructuralRejectBelow.Value;

            if (floors.SemanticWarnBelow.HasValue)
                semanticWarn = floors.SemanticWarnBelow.Value;

            if (floors.SemanticRejectBelow.HasValue)
                semanticReject = floors.SemanticRejectBelow.Value;
        }

        return new EffectiveFloors(structuralWarn, structuralReject, semanticWarn, semanticReject);
    }

    /// <summary>Effective floors for every <see cref="AgentType" /> (operators compare global vs override posture).</summary>
    public static IReadOnlyList<(AgentType AgentType, EffectiveFloors Floors)> ResolveForAllAgentTypes(
        AgentOutputQualityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        AgentType[] agentTypes = Enum.GetValues<AgentType>();

        return agentTypes
            .Select(agentType => (agentType, Resolve(options, agentType)))
            .ToArray();
    }
}
