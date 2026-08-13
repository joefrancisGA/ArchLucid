using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Deterministic structural security baseline checks over PROTECTS edges and baseline metadata.
/// </summary>
public static class SecurityTraceabilityAnalyzer
{
    public static IReadOnlyList<SecurityTraceabilityGap> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<SecurityTraceabilityGap> gaps = [];
        IReadOnlyList<GraphNode> securityNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.SecurityBaseline);
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);

        if (securityNodes.Count == 0)
            return gaps;

        foreach (GraphNode securityNode in securityNodes)
        {
            List<GraphNode> protectedTargets = graphSnapshot
                .GetOutgoingTargets(
                    securityNode.NodeId,
                    GraphEdgeTypes.Protects,
                    GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
                .ToList();

            if (protectedTargets.Count == 0)
            {
                gaps.Add(new SecurityTraceabilityGap
                {
                    GapCode = "security-baseline-without-protects",
                    Title = $"Security baseline '{securityNode.Label}' protects no topology resources",
                    Rationale = "No PROTECTS edge links this security baseline to any graph node.",
                    Description = $"Security baseline '{securityNode.Label}' is isolated from topology resources.",
                    Impact = "Reviewers cannot trace which resources inherit this control.",
                    RelatedNodeIds = [securityNode.NodeId]
                });

                continue;
            }

            List<string> nonTopologyTargets = protectedTargets
                .Where(n => !string.Equals(n.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                .Select(static n => n.NodeId)
                .ToList();

            if (nonTopologyTargets.Count > 0)
            {
                gaps.Add(new SecurityTraceabilityGap
                {
                    GapCode = "security-baseline-protects-non-topology",
                    Title = $"Security baseline '{securityNode.Label}' protects non-topology nodes",
                    Rationale = "PROTECTS edges must target TopologyResource nodes for category-scoped coverage.",
                    Description = $"Security baseline '{securityNode.Label}' has {nonTopologyTargets.Count} non-topology PROTECTS targets.",
                    Impact = "Security coverage metrics may count protected nodes that are not architecture resources.",
                    RelatedNodeIds = [securityNode.NodeId, .. nonTopologyTargets]
                });
            }

            securityNode.Properties.TryGetValue("status", out string? status);

            if (string.Equals(status, "missing", StringComparison.OrdinalIgnoreCase) && protectedTargets.Count > 0)
            {
                gaps.Add(new SecurityTraceabilityGap
                {
                    GapCode = "missing-baseline-with-protects",
                    Title = $"Missing security baseline '{securityNode.Label}' still declares PROTECTS edges",
                    Rationale = "A baseline marked missing should not claim topology protection scope.",
                    Description = $"Security baseline '{securityNode.Label}' is missing but protects {protectedTargets.Count} resources.",
                    Impact = "Coverage and gap engines may disagree on whether the control is enforced.",
                    RelatedNodeIds = [securityNode.NodeId, .. protectedTargets.Select(static n => n.NodeId)]
                });
            }
        }

        if (topologyNodes.Count == 0)
            return gaps;

        HashSet<string> protectedTopologyIds = graphSnapshot.Edges
            .Where(e => string.Equals(e.EdgeType, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase)
                        && e.Weight >= GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
            .Select(static e => e.ToNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<GraphNode> unprotectedCompute = topologyNodes
            .Where(n => string.Equals(n.Category, GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase))
            .Where(n => !protectedTopologyIds.Contains(n.NodeId))
            .ToList();

        if (unprotectedCompute.Count > 0)
        {
            gaps.Add(new SecurityTraceabilityGap
            {
                GapCode = "compute-without-security-baseline",
                Title = "Compute resources lack any security baseline protection",
                Rationale = "At least one compute TopologyResource has no incoming PROTECTS edge.",
                Description = $"{unprotectedCompute.Count} compute resource(s) are not covered by a security baseline.",
                Impact = "Security reviewers cannot verify control inheritance for compute workloads.",
                RelatedNodeIds = unprotectedCompute.Select(static n => n.NodeId).ToList()
            });
        }

        return gaps;
    }
}
