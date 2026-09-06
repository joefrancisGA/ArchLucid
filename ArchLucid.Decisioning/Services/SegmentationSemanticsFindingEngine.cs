using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Flags declared NSG / security group / NetworkPolicy rules that expose admin ports to the internet on paths to
///     datastores or jump boxes (DX-07).
/// </summary>
public sealed class SegmentationSemanticsFindingEngine : IFindingEngine
{
    public const int MaxFindings = 20;

    public string EngineType => "segmentation-semantics";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<Finding>>([]);
        }

        List<Finding> findings = [];

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (!SegmentationSemanticsPathAnalyzer.IsSegmentationControlNode(node))
            {
                continue;
            }

            IReadOnlyList<SegmentationRiskyRule> riskyRules = SegmentationRuleParser.ParseRiskyRules(node.Properties);

            if (riskyRules.Count == 0)
            {
                continue;
            }

            if (!SegmentationSemanticsPathAnalyzer.HasPathToSensitiveTarget(
                    graphSnapshot,
                    node.NodeId,
                    out GraphNode? targetNode,
                    out int hopCount))
            {
                continue;
            }

            foreach (SegmentationRiskyRule riskyRule in riskyRules)
            {
                findings.Add(BuildFinding(node, riskyRule, targetNode, hopCount));

                if (findings.Count >= MaxFindings)
                {
                    return Task.FromResult<IReadOnlyList<Finding>>(findings);
                }
            }
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(
        GraphNode segmentationNode,
        SegmentationRiskyRule riskyRule,
        GraphNode? targetNode,
        int hopCount)
    {
        string label = string.IsNullOrWhiteSpace(segmentationNode.Label)
            ? segmentationNode.NodeId
            : segmentationNode.Label.Trim();

        List<string> relatedNodeIds = [segmentationNode.NodeId];

        if (targetNode is not null && !string.IsNullOrWhiteSpace(targetNode.NodeId))
        {
            relatedNodeIds.Add(targetNode.NodeId);
        }

        List<string> traceNotes =
        [
            BuildEvidenceNote(segmentationNode),
        ];

        if (targetNode is not null && !string.IsNullOrWhiteSpace(targetNode.NodeId))
        {
            traceNotes.Add($"evidence:graph-node:{targetNode.NodeId.Trim()}");
        }

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "SegmentationSemanticsFinding",
            Category = "Security",
            EngineType = "segmentation-semantics",
            Severity = FindingSeverity.Error,
            Title = $"Segmentation control '{label}' allows inbound port {riskyRule.DestinationPort} from the internet",
            Rationale =
                $"Declared rule material on '{label}' exposes administrative port {riskyRule.DestinationPort} to the internet within {hopCount} hop(s) of a sensitive target.",
            DecisionConsequence =
                "Restrict inbound admin ports to trusted CIDR ranges or place the target behind private networking before approval.",
            RelatedNodeIds = relatedNodeIds,
            PayloadType = nameof(SegmentationSemanticsFindingPayload),
            Payload = new SegmentationSemanticsFindingPayload
            {
                SegmentationNodeId = segmentationNode.NodeId,
                DestinationPort = riskyRule.DestinationPort,
                TargetNodeId = targetNode?.NodeId,
                HopCountToTarget = hopCount,
                MatchedPropertyKey = riskyRule.MatchedPropertyKey,
            },
            RecommendedActions =
            [
                $"Remove internet-wide allow rules for port {riskyRule.DestinationPort} or scope sources to private CIDR blocks.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["segmentation-semantics", riskyRule.MatchedPropertyKey],
                DecisionsTaken =
                [
                    "Internet-exposed admin inbound port on segmentation control with sensitive target path.",
                ],
                Notes = traceNotes,
            },
        };
    }

    private static string BuildEvidenceNote(GraphNode node)
    {
        if (!string.IsNullOrWhiteSpace(node.SourceId)
            && LooksLikeDeclarationPath(node.SourceId))
        {
            return $"evidence:doc:{node.SourceId.Trim()}";
        }

        return $"evidence:graph-node:{node.NodeId}";
    }

    private static bool LooksLikeDeclarationPath(string sourceId)
    {
        return sourceId.Contains('/', StringComparison.Ordinal)
            || sourceId.Contains('\\', StringComparison.Ordinal)
            || sourceId.EndsWith(".tf", StringComparison.OrdinalIgnoreCase)
            || sourceId.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
            || sourceId.EndsWith(".yaml", StringComparison.OrdinalIgnoreCase)
            || sourceId.EndsWith(".yml", StringComparison.OrdinalIgnoreCase);
    }
}
