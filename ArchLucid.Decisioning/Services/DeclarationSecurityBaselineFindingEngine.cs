using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Emits deterministic security findings from declaration-ingested graph node properties (<c>tf.*</c>, ARM, Bicep).
/// </summary>
public sealed class DeclarationSecurityBaselineFindingEngine : IFindingEngine
{
    public string EngineType => "declaration-security-baseline";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        _ = ct;

        List<Finding> findings = [];

        foreach (GraphNode node in graphSnapshot.GetNodesByType("TopologyResource"))
            AddFindingsForNode(node, findings);

        foreach (GraphNode node in graphSnapshot.GetNodesByType("SecurityBaseline"))
            AddFindingsForNode(node, findings);

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static void AddFindingsForNode(GraphNode node, List<Finding> findings)
    {
        string label = string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label;
        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify(label, node.Properties);

        foreach (DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal signal in signals)
        {
            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "DeclarationSecurityBaselineFinding",
                Category = "Security",
                EngineType = "declaration-security-baseline",
                Severity = signal.Severity,
                Title = signal.Title,
                Rationale =
                    "Infrastructure declaration properties on the knowledge graph indicate a security posture risk.",
                RelatedNodeIds = [node.NodeId],
                RecommendedActions =
                [
                    "Review the cited declaration attribute and align the resource with your security baseline.",
                ],
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [node.NodeId],
                    RulesApplied = ["declaration-security-baseline", signal.Theme],
                    DecisionsTaken =
                    [
                        "Unsafe or weak declaration attribute present on ingested infrastructure object.",
                    ],
                },
            });
        }
    }
}
