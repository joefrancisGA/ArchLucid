using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.Decisioning.Services;

public class RequirementFindingEngine : IFindingEngine
{
    public string EngineType => "requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        var findings = new List<Finding>();

        var requirementNodes = graphSnapshot.Nodes
            .Where(n => n.NodeType == "Requirement")
            .ToList();

        foreach (var node in requirementNodes)
        {
            findings.Add(new Finding
            {
                FindingType = "RequirementFinding",
                EngineType = EngineType,
                Severity = FindingSeverity.Info,
                Title = $"Requirement detected: {node.Label}",
                Rationale = "A requirement node exists and must be reflected in the resolved architecture.",
                RelatedNodeIds = new List<string> { node.NodeId },
                RecommendedActions = new List<string>
                {
                    "Carry this requirement into the GoldenManifest."
                },
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = new List<string> { node.NodeId },
                    DecisionsTaken = new List<string>
                    {
                        "Promote requirement into candidate architecture decision input."
                    }
                }
            });
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}

