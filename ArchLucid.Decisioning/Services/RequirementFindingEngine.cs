using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Services;

public class RequirementFindingEngine : IFindingEngine
{
    public string EngineType => "requirement";
    public string Category => "Requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        List<Finding> findings = [];

        IReadOnlyList<GraphNode> requirementNodes = graphSnapshot.GetNodesByType("Requirement");

        foreach (GraphNode node in requirementNodes)
        {
            node.Properties.TryGetValue("text", out string? requirementText);
            bool? isMandatory = TryReadMandatoryFlag(node.Properties);

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

            string requirementLabel = GraphNodeReviewerLabel.ForFindingTitle(node.Label);

            string mandatoryRationale = isMandatory is null
                ? DecisioningFindingHonestyCopy.MandatoryFlagNotStored
                : isMandatory.Value
                    ? "Mandatory flag was stored true."
                    : "Mandatory flag was stored false.";

            Finding finding = FindingFactory.CreateRequirementFinding(
                EngineType,
                $"Requirement detected: {requirementLabel}",
                $"A requirement node exists and must be reflected in the resolved architecture. {mandatoryRationale}",
                node.Label,
                requirementText,
                isMandatory ?? false,
                relatedNodeIds);

            finding.RecommendedActions.Add("Carry this requirement into the ManifestDocument.");
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
                Notes = BuildRequirementTraceNotes(relatedFromGraph.Count, requirementText, isMandatory),
            };

            findings.Add(finding);
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static bool? TryReadMandatoryFlag(IReadOnlyDictionary<string, string> properties)
    {
        foreach (string key in new[] { "mandatory", "isMandatory", "is_mandatory" })
        {
            if (!properties.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            {
                continue;
            }

            if (bool.TryParse(raw.Trim(), out bool parsed))
            {
                return parsed;
            }
        }

        return null;
    }

    private static List<string> BuildRequirementTraceNotes(int relatedCount, string? requirementText, bool? isMandatory)
    {
        List<string> notes =
        [
            $"Related topology resources: {relatedCount}",
            FormatRequirementTextTraceNote(requirementText),
        ];

        if (isMandatory is null)
        {
            notes.Add(DecisioningFindingHonestyCopy.MandatoryFlagNotStored);
        }

        return notes;
    }

    private static string FormatRequirementTextTraceNote(string? requirementText) =>
        requirementText is null
            ? DecisioningFindingHonestyCopy.RequirementTextNotStored
            : requirementText.Length == 0
                ? DecisioningFindingHonestyCopy.RequirementTextNotStored
                : string.IsNullOrWhiteSpace(requirementText)
                    ? DecisioningFindingHonestyCopy.RequirementTextStoredEmpty
                    : $"Requirement text length: {requirementText.Trim().Length} chars";
}
