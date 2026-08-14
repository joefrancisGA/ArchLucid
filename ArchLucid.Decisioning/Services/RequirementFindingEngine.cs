using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public class RequirementFindingEngine : IFindingEngine
{
    public string EngineType => "requirement";
    public string Category => "Requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        List<Finding> findings = [];

        IReadOnlyList<GraphNode> requirementNodes = graphSnapshot.GetNodesByType("Requirement");

        foreach (GraphNode node in requirementNodes)
        {
            node.Properties.TryGetValue("text", out string? requirementText);

            List<GraphEdge> relatesToEdges = graphSnapshot.Edges
                .Where(edge =>
                    string.Equals(edge.FromNodeId, node.NodeId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(edge.EdgeType, GraphEdgeTypes.RelatesTo, StringComparison.OrdinalIgnoreCase)
                    && edge.Weight >= GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
                .ToList();

            List<string> relatedFromGraph = relatesToEdges
                .Select(edge => edge.ToNodeId)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            bool hasExplicitTargets = relatesToEdges.Any(edge =>
                string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.RequirementTargeted,
                    StringComparison.OrdinalIgnoreCase));

            List<string> relatedNodeIds = [node.NodeId];

            foreach (string id in relatedFromGraph.Where(id =>
                         !relatedNodeIds.Contains(id, StringComparer.OrdinalIgnoreCase)))

                relatedNodeIds.Add(id);

            Finding finding = FindingFactory.CreateRequirementFinding(
                EngineType,
                $"Requirement detected: {node.Label}",
                "A requirement node exists and must be reflected in the resolved architecture.",
                node.Label,
                requirementText ?? string.Empty,
                true,
                relatedNodeIds);

            finding.RecommendedActions.Add("Carry this requirement into the ManifestDocument.");
            string text = requirementText ?? string.Empty;

            finding.Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["requirement-surface"],
                DecisionsTaken =
                [
                    relatedFromGraph.Count > 0
                        ? hasExplicitTargets
                            ? "Linked requirement to topology resources via explicit relatedTopologyNodeIds."
                            : "Linked requirement to the sole in-scope topology resource (single-topology fallback)."
                        : "Promote requirement into candidate architecture decision input."
                ],
                AlternativePathsConsidered = relatedFromGraph.Count > 0
                    ?
                    [
                        "Extend RELATES_TO coverage to additional in-scope topology resources before finalizing.",
                        "Treat current requirement links as sufficient for this review cycle."
                    ]
                    :
                    [
                        "Add TopologyResource nodes and explicit relatedTopologyNodeIds on the requirement.",
                        "Track as backlog until architecture scope includes target resources."
                    ],
                Notes =
                [
                    $"Related topology resources: {relatedFromGraph.Count}",
                    string.IsNullOrWhiteSpace(text)
                        ? "No requirement text provided."
                        : $"Requirement text length: {text.Length} chars"
                ]
            };

            findings.Add(finding);
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}
