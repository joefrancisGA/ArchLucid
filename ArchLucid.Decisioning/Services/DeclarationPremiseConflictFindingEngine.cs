using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Emits premise-conflict findings when ingested declaration properties contradict linked security or policy intent.
///     Intentionally complements <see cref="DeclarationSecurityBaselineFindingEngine" />:
///     ADR 0063 merge keeps both when identities differ — one states the unsafe value, the other states the contradiction.
/// </summary>
public sealed class DeclarationPremiseConflictFindingEngine : IFindingEngine
{
    public string EngineType => "declaration-premise-conflict";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        _ = ct;

        List<Finding> findings = [];

        foreach (GraphNode topologyNode in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
            AddFindingsForNode(graphSnapshot, topologyNode, findings);

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static void AddFindingsForNode(
        GraphSnapshot graphSnapshot,
        GraphNode topologyNode,
        List<Finding> findings)
    {
        IReadOnlyList<ApplicableIntentNode> applicableIntentNodes = ResolveApplicableIntentNodes(graphSnapshot, topologyNode);
        IReadOnlyList<DeclarationPremiseConflictSignal> signals =
            DeclarationPremiseConflictClassifier.Classify(topologyNode, applicableIntentNodes);

        string resourceLabel = string.IsNullOrWhiteSpace(topologyNode.Label)
            ? topologyNode.NodeId
            : topologyNode.Label;

        foreach (DeclarationPremiseConflictSignal signal in signals)
        {
            GraphNode? intentNode = graphSnapshot.Nodes
                .FirstOrDefault(node => string.Equals(node.NodeId, signal.IntentNodeId, StringComparison.OrdinalIgnoreCase));

            string intentLabel = intentNode is null || string.IsNullOrWhiteSpace(intentNode.Label)
                ? signal.IntentNodeId
                : intentNode.Label;

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "DeclarationPremiseConflictFinding",
                Category = "Security",
                EngineType = "declaration-premise-conflict",
                Severity = signal.IsNarrowApplicability ? FindingSeverity.Error : FindingSeverity.Warning,
                Title = $"{resourceLabel} declaration conflicts with {intentLabel} requirement",
                Rationale =
                    $"Declaration property '{signal.DeclarationPropertyKey}' is '{signal.DeclarationPropertyValue}', "
                    + $"but linked intent requires: \"{signal.IntentRequirementText}\".",
                DecisionConsequence =
                    "The review premise is invalid until the operator corrects the declaration or amends the baseline.",
                RelatedNodeIds = [topologyNode.NodeId, signal.IntentNodeId],
                RecommendedActions =
                [
                    "Align the declaration property with the stated security baseline or policy control, or update the intent node to reflect the actual posture.",
                ],
                PayloadType = nameof(DeclarationPremiseConflictFindingPayload),
                Payload = new DeclarationPremiseConflictFindingPayload
                {
                    ConflictKind = signal.ConflictKind,
                    DeclarationPropertyKey = signal.DeclarationPropertyKey,
                    DeclarationPropertyValue = signal.DeclarationPropertyValue,
                    IntentNodeId = signal.IntentNodeId,
                    IntentRequirementText = signal.IntentRequirementText,
                    IsNarrowApplicability = signal.IsNarrowApplicability,
                    TopologyNodeId = topologyNode.NodeId,
                },
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [topologyNode.NodeId, signal.IntentNodeId],
                    RulesApplied = ["declaration-premise-conflict", signal.ConflictKind],
                    DecisionsTaken =
                    [
                        signal.IsNarrowApplicability
                            ? "Narrow PROTECTS/APPLIES_TO edge linked declaration property to intent requirement."
                            : "Graph-wide intent fallback linked declaration property to intent requirement.",
                    ],
                },
            });
        }
    }

    private static IReadOnlyList<ApplicableIntentNode> ResolveApplicableIntentNodes(
        GraphSnapshot graphSnapshot,
        GraphNode topologyNode)
    {
        List<ApplicableIntentNode> narrowIntentNodes = [];

        foreach (string edgeType in new[] { GraphEdgeTypes.Protects, GraphEdgeTypes.AppliesTo })
        {
            foreach (GraphNode source in GetIncomingSourcesWithMinWeight(
                         graphSnapshot,
                         topologyNode.NodeId,
                         edgeType,
                         GraphEdgeDecisioningThresholds.MinWeightForSemanticLink))
            {
                if (!IsIntentNode(source))
                    continue;

                narrowIntentNodes.Add(new ApplicableIntentNode(source, true));
            }
        }

        if (narrowIntentNodes.Count > 0)
            return narrowIntentNodes;

        return graphSnapshot.Nodes
            .Where(IsIntentNode)
            .Select(node => new ApplicableIntentNode(node, false))
            .ToList();
    }

    private static IReadOnlyList<GraphNode> GetIncomingSourcesWithMinWeight(
        GraphSnapshot graphSnapshot,
        string toNodeId,
        string edgeType,
        double minWeightInclusive)
    {
        HashSet<string> sourceIds = graphSnapshot.Edges
            .Where(edge =>
                string.Equals(edge.ToNodeId, toNodeId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(edge.EdgeType, edgeType, StringComparison.OrdinalIgnoreCase)
                && edge.Weight >= minWeightInclusive)
            .Select(edge => edge.FromNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return graphSnapshot.Nodes
            .Where(node => sourceIds.Contains(node.NodeId))
            .ToList();
    }

    private static bool IsIntentNode(GraphNode node) =>
        string.Equals(node.NodeType, GraphNodeTypes.SecurityBaseline, StringComparison.OrdinalIgnoreCase)
        || string.Equals(node.NodeType, GraphNodeTypes.PolicyControl, StringComparison.OrdinalIgnoreCase);
}
