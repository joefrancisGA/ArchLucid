using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Interfaces;

namespace ArchLucid.KnowledgeGraph.Projection;

/// <summary>
///     Projects architecture knowledge model elements into graph nodes and edges.
///     Draft/unsealed models are projected with an explicit warning — not treated as sealed graphs.
/// </summary>
public sealed class ArchitectureKnowledgeModelGraphProjector : IArchitectureKnowledgeModelGraphProjector
{
    private static readonly HashSet<ArchitectureElementKind> GraphStructuralKinds = new()
    {
        ArchitectureElementKind.Component,
        ArchitectureElementKind.Interface,
        ArchitectureElementKind.DataFlow,
        ArchitectureElementKind.TrustBoundary,
        ArchitectureElementKind.DeploymentTopology,
        ArchitectureElementKind.FailureMode,
        ArchitectureElementKind.ComplianceObligation,
        ArchitectureElementKind.Assumption,
        ArchitectureElementKind.QualityAttribute,
        ArchitectureElementKind.CostDriver,
        ArchitectureElementKind.Stakeholder,
        ArchitectureElementKind.FunctionalRequirement,
        ArchitectureElementKind.Constraint,
        ArchitectureElementKind.RecoveryObjective,
        ArchitectureElementKind.CapacityExpectation,
        ArchitectureElementKind.OperationalOwnership,
        ArchitectureElementKind.Risk,
        ArchitectureElementKind.Decision,
        ArchitectureElementKind.Alternative,
        ArchitectureElementKind.TradeOff,
        ArchitectureElementKind.Contradiction,
    };

    public GraphSnapshot Project(
        ArchitectureKnowledgeModel model,
        ContextSnapshot contextSnapshot,
        Guid runId)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        List<string> warnings = [];

        if (model.IsProvisionalSynthesis)
        {
            warnings.Add(
                "Graph projected from unsealed provisional knowledge model; topology may change when framing completes.");
        }

        warnings.Add(
            "Graph projected from ArchitectureKnowledgeModel (κ→Γ morphism); not a sealed intake rebuild.");

        HashSet<string> nodeIds = new(StringComparer.Ordinal);

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (!GraphStructuralKinds.Contains(element.Kind))
                continue;

            string nodeId = ToGraphNodeId(element.ElementId);

            if (!nodeIds.Add(nodeId))
                continue;

            nodes.Add(new GraphNode
            {
                NodeId = nodeId,
                NodeType = MapNodeType(element.Kind),
                Label = element.Name,
                Category = element.Kind.ToString(),
                SourceType = "ArchitectureKnowledgeModel",
                SourceId = element.ElementId,
                Properties = BuildNodeProperties(element),
                ReasoningTrace = element.Description,
            });
        }

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (!GraphStructuralKinds.Contains(element.Kind))
                continue;

            string fromNodeId = ToGraphNodeId(element.ElementId);

            if (!nodeIds.Contains(fromNodeId))
                continue;

            foreach (string relatedId in element.RelatedElementIds)
            {
                string toNodeId = ToGraphNodeId(relatedId);

                if (!nodeIds.Contains(toNodeId))
                    continue;

                edges.Add(new GraphEdge
                {
                    EdgeId = $"{fromNodeId}->{toNodeId}:RELATES",
                    FromNodeId = fromNodeId,
                    ToNodeId = toNodeId,
                    EdgeType = MapEdgeType(element.Kind),
                    Label = element.Kind.ToString(),
                    Weight = element.ExtractionConfidence > 0 ? element.ExtractionConfidence : 1d,
                    InferenceSource = "knowledge-model-morphism",
                });
            }
        }

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = contextSnapshot.SnapshotId,
            RunId = runId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = nodes,
            Edges = edges,
            Warnings = warnings,
        };
    }

    internal static string ToGraphNodeId(string elementId) => $"akm:{elementId}";

    private static string MapNodeType(ArchitectureElementKind kind)
    {
        return kind switch
        {
            ArchitectureElementKind.Component => GraphNodeTypes.TopologyResource,
            ArchitectureElementKind.Interface => GraphNodeTypes.TopologyResource,
            ArchitectureElementKind.DeploymentTopology => GraphNodeTypes.TopologyResource,
            ArchitectureElementKind.TrustBoundary => GraphNodeTypes.TrustBoundary,
            ArchitectureElementKind.ComplianceObligation => GraphNodeTypes.PolicyControl,
            ArchitectureElementKind.Assumption => GraphNodeTypes.Assumption,
            ArchitectureElementKind.QualityAttribute => GraphNodeTypes.QualityAttribute,
            ArchitectureElementKind.FailureMode => GraphNodeTypes.FailureMode,
            ArchitectureElementKind.CostDriver => GraphNodeTypes.CostConstraint,
            ArchitectureElementKind.Stakeholder => GraphNodeTypes.Actor,
            ArchitectureElementKind.FunctionalRequirement => GraphNodeTypes.Requirement,
            _ => GraphNodeTypes.TopologyResource,
        };
    }

    private static string MapEdgeType(ArchitectureElementKind kind)
    {
        return kind switch
        {
            ArchitectureElementKind.DataFlow => GraphEdgeTypes.ConnectsTo,
            ArchitectureElementKind.Interface => GraphEdgeTypes.Exposes,
            ArchitectureElementKind.TrustBoundary => GraphEdgeTypes.Protects,
            _ => GraphEdgeTypes.RelatesTo,
        };
    }

    private static Dictionary<string, string> BuildNodeProperties(ArchitectureModelElement element)
    {
        Dictionary<string, string> properties = new(element.Properties, StringComparer.Ordinal)
        {
            ["architectureElementKind"] = element.Kind.ToString(),
            ["lifecycleScope"] = element.LifecycleScope.ToString(),
            ["extractionConfidence"] = element.ExtractionConfidence.ToString("F3"),
            ["provenanceOrigin"] = element.Provenance.Origin.ToString(),
            ["provenanceSupport"] = element.Provenance.SupportStatus.ToString(),
        };

        if (element.SourcePassageIds.Count > 0)
        {
            properties["sourcePassageIds"] = string.Join(',', element.SourcePassageIds);
        }

        return properties;
    }
}
