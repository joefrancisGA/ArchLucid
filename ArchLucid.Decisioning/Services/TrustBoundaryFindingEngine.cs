using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Heuristic cross-trust-boundary checks when internal and external actors coexist (TB-2344).
/// </summary>
public sealed class TrustBoundaryFindingEngine : IFindingEngine
{
    public string EngineType => "trust-boundary";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<GraphNode> actorNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.Actor);

        if (actorNodes.Count < 2)
            return Task.FromResult<IReadOnlyList<Finding>>([]);

        bool hasInternal = actorNodes.Any(ActorOriginHeuristics.IsInternalActor);
        bool hasExternal = actorNodes.Any(ActorOriginHeuristics.IsExternalFacingActor);
        IReadOnlyList<GraphNode> trustBoundaryNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TrustBoundary);

        if (!hasInternal || !hasExternal || trustBoundaryNodes.Count > 0)
            return Task.FromResult<IReadOnlyList<Finding>>([]);

        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "TrustBoundaryFinding",
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Title = "Mixed internal and external actors without trust-boundary segmentation",
            Rationale =
                "When both internal and external actors interact with the system, an explicit trust-boundary model is required to verify cross-boundary data flows.",
            PayloadType = nameof(TrustBoundaryFindingPayload),
            Payload = new TrustBoundaryFindingPayload
            {
                ActorCount = actorNodes.Count,
                InternalActorCount = actorNodes.Count(ActorOriginHeuristics.IsInternalActor),
                ExternalActorCount = actorNodes.Count(ActorOriginHeuristics.IsExternalFacingActor),
            },
            RelatedNodeIds = actorNodes.Select(static n => n.NodeId).ToList(),
            RecommendedActions =
            [
                "Model trust boundaries for each external-facing actor and verify ingress/egress controls.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = actorNodes.Select(static n => n.NodeId).ToList(),
                RulesApplied = ["trust-boundary-cross-origin"],
                DecisionsTaken =
                [
                    "Detected internal and external actors with no TrustBoundary nodes.",
                ],
            },
        };

        return Task.FromResult<IReadOnlyList<Finding>>([finding]);
    }
}
