using ArchLucid.KnowledgeGraph;

namespace ArchLucid.KnowledgeGraph.Inference;

/// <summary>
///     Stable, deterministic explanations attached to inferred <see cref="Models.GraphEdge" /> rows for explainability UX.
/// </summary>
public static class GraphEdgeInferenceReasoningSummaries
{
    /// <summary>
    ///     Returns a human-readable trace for edges produced by <see cref="DefaultGraphEdgeInferer" />.
    /// </summary>
    public static string ForRule(string inferenceSource)
    {
        if (string.IsNullOrWhiteSpace(inferenceSource))
            return string.Empty;

        switch (inferenceSource.Trim())
        {
            case GraphEdgeInferenceSources.ContextMembership:
                return "ArchLucid linked each ingested artifact node to the run's context snapshot node with a Contains "
                       + "relationship so traversal always has a stable root.";

            case GraphEdgeInferenceSources.ExplicitParentChild:
                return "This edge was inferred from connector metadata: the child node declares parentNodeId matching an "
                       + "existing topology node.";

            case GraphEdgeInferenceSources.HeuristicNetworkSubnet:
                return "ArchLucid matched a subnet-shaped topology node to a network anchor (single-network graph, subnet "
                       + "label embeds network name, or parentNodeId points at the network) and emitted ContainsResource "
                       + "for layout heuristics—validate against your ARM inventory.";

            case GraphEdgeInferenceSources.PolicyTargeted:
                return "The policy node's applicableTopologyNodeIds property listed this topology id; ArchLucid narrowed "
                       + "AppliesTo to explicit targets rather than broadcasting to every resource.";

            case GraphEdgeInferenceSources.PolicySingleTopologyFallback:
                return "Only one topology anchor existed while the policy had no explicit applicableTopologyNodeIds; "
                       + "ArchLucid assumed the policy scopes to that lone resource.";

            case GraphEdgeInferenceSources.RequirementTargeted:
                return "The requirement's relatedTopologyNodeIds property referenced this topology id; ArchLucid wired "
                       + "RelatesTo for traceability.";

            case GraphEdgeInferenceSources.RequirementTextHeuristic:
                return "No explicit relatedTopologyNodeIds were present; ArchLucid reused requirement text keywords "
                       + "(network, storage, compute, security, database) to suggest likely topology links—treat this as "
                       + "hypothesis-grade until confirmed.";

            case GraphEdgeInferenceSources.SecurityTargeted:
                return "Security baseline advertised protectedTopologyNodeIds including this id; ArchLucid surfaced a "
                       + "Protects edge accordingly.";

            case GraphEdgeInferenceSources.SecuritySingleTopologyFallback:
                return "Baseline did not advertise explicit targets yet exactly one topology node existed; ArchLucid "
                       + "assumed protections apply there.";

            default:
                return $"ArchLucid inferred this edge via rule `{inferenceSource.Trim()}` "
                       + "(deterministic heuristic or connector hint).";
        }
    }
}
