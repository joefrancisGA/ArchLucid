using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.Decisioning.Services;

public class TopologySanityFindingEngine : IFindingEngine
{
    public string EngineType => "topology-sanity";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        var findings = new List<Finding>();

        var topologyNodes = graphSnapshot.Nodes
            .Where(n => n.NodeType == "TopologyResource")
            .ToList();

        if (topologyNodes.Count == 0)
        {
            findings.Add(new Finding
            {
                FindingType = "TopologyGap",
                EngineType = EngineType,
                Severity = FindingSeverity.Warning,
                Title = "No topology resources were found",
                Rationale = "The graph does not yet contain TopologyResource nodes.",
                RecommendedActions = new List<string>
                {
                    "Ingest topology resources before architecture synthesis."
                },
                Trace = new ExplainabilityTrace
                {
                    DecisionsTaken = new List<string>
                    {
                        "Marked graph as incomplete for deployment-level decisions."
                    }
                }
            });
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}

