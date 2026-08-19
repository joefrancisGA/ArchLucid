using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Flags external or anonymous actors that lack an explicit trust-boundary node (TB-2344).
/// </summary>
public sealed class ExternalExposureFindingEngine : IFindingEngine
{
    public string EngineType => "external-exposure";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<GraphNode> actorNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.Actor);
        IReadOnlyList<GraphNode> trustBoundaryNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TrustBoundary);
        List<Finding> findings = [];

        foreach (GraphNode actor in actorNodes)
        {
            if (!IsExternalFacingActor(actor))
                continue;

            bool hasBoundary = trustBoundaryNodes.Any(boundary =>
                boundary.Properties.TryGetValue("actorNodeId", out string? actorNodeId)
                && string.Equals(actorNodeId, actor.NodeId, StringComparison.OrdinalIgnoreCase));

            if (hasBoundary)
                continue;

            string label = string.IsNullOrWhiteSpace(actor.Label) ? actor.NodeId : actor.Label;

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "ExternalExposureFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Warning,
                Title = $"External actor '{label}' lacks an explicit trust boundary",
                Rationale =
                    "External or anonymous actors must be modeled with TrustBoundary nodes so security engines can verify cross-boundary controls.",
                PayloadType = nameof(ExternalExposureFindingPayload),
                Payload = new ExternalExposureFindingPayload
                {
                    ActorNodeId = actor.NodeId,
                    ActorLabel = label,
                    TrustOrigin = actor.Properties.GetValueOrDefault("trustOrigin") ?? "unknown",
                },
                RelatedNodeIds = [actor.NodeId],
                RecommendedActions =
                [
                    "Add a TrustBoundary node linked to the external actor and document ingress controls.",
                ],
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [actor.NodeId],
                    RulesApplied = ["external-exposure-trust-boundary"],
                    DecisionsTaken =
                    [
                        "External-facing actor present without matching TrustBoundary node.",
                    ],
                },
            });
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static bool IsExternalFacingActor(GraphNode actor)
    {
        if (!actor.Properties.TryGetValue("trustOrigin", out string? trustOrigin))
            return false;

        return string.Equals(trustOrigin, nameof(TrustOrigin.External), StringComparison.OrdinalIgnoreCase)
            || string.Equals(trustOrigin, nameof(TrustOrigin.PublicAnonymous), StringComparison.OrdinalIgnoreCase);
    }
}
