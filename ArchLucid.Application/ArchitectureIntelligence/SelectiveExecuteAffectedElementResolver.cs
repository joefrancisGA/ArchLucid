using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Maps selectively re-executed agent types to knowledge-model element ids for incremental re-review scope.
/// </summary>
public static class SelectiveExecuteAffectedElementResolver
{
    private static readonly IReadOnlyDictionary<AgentType, HashSet<ArchitectureElementKind>> AgentTypeElementKinds =
        new Dictionary<AgentType, HashSet<ArchitectureElementKind>>
        {
            [AgentType.Topology] =
            [
                ArchitectureElementKind.Component,
                ArchitectureElementKind.Interface,
                ArchitectureElementKind.DataFlow,
                ArchitectureElementKind.TrustBoundary,
                ArchitectureElementKind.DeploymentTopology,
            ],
            [AgentType.Cost] =
            [
                ArchitectureElementKind.QualityAttribute,
                ArchitectureElementKind.CostDriver,
                ArchitectureElementKind.CapacityExpectation,
            ],
            [AgentType.Compliance] =
            [
                ArchitectureElementKind.ComplianceObligation,
                ArchitectureElementKind.Constraint,
                ArchitectureElementKind.Risk,
            ],
            [AgentType.Critic] = [],
        };

    public static bool RequiresFullReReview(IEnumerable<AgentType> forcedAgentTypes)
    {
        return forcedAgentTypes.Any(agentType => agentType == AgentType.Critic);
    }

    public static IReadOnlyList<string> ResolveAffectedElementIds(
        ArchitectureKnowledgeModel model,
        IEnumerable<AgentType> forcedAgentTypes,
        IReadOnlyList<string>? explicitAffectedElementIds)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(forcedAgentTypes);

        if (explicitAffectedElementIds is { Count: > 0 })
        {
            return explicitAffectedElementIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.Ordinal)
                .ToList();
        }

        HashSet<ArchitectureElementKind> targetKinds = [];

        foreach (AgentType agentType in forcedAgentTypes)
        {
            if (!AgentTypeElementKinds.TryGetValue(agentType, out HashSet<ArchitectureElementKind>? kinds))
                continue;

            targetKinds.UnionWith(kinds);
        }

        if (targetKinds.Count == 0)
            return [];

        return model.Elements
            .Where(element => targetKinds.Contains(element.Kind))
            .Select(element => element.ElementId)
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }
}
