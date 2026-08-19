using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Surfaces internal human actors for privileged-access review (TB-2344).
/// </summary>
public sealed class PrivilegedAccessFindingEngine : IFindingEngine
{
    public string EngineType => "privileged-access";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<GraphNode> privilegedActors = graphSnapshot
            .GetNodesByType(GraphNodeTypes.Actor)
            .Where(IsInternalHumanActor)
            .ToList();

        if (privilegedActors.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>([]);

        List<Finding> findings = [];

        foreach (GraphNode actor in privilegedActors)
        {
            string label = string.IsNullOrWhiteSpace(actor.Label) ? actor.NodeId : actor.Label;

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "PrivilegedAccessFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Info,
                Title = $"Review privileged access for internal human actor '{label}'",
                Rationale =
                    "Internal human actors typically require explicit privileged-access and session controls in the target architecture.",
                PayloadType = nameof(PrivilegedAccessFindingPayload),
                Payload = new PrivilegedAccessFindingPayload
                {
                    ActorNodeId = actor.NodeId,
                    ActorLabel = label,
                    Kind = actor.Properties.GetValueOrDefault("kind") ?? "Human",
                },
                RelatedNodeIds = [actor.NodeId],
                RecommendedActions =
                [
                    "Document IdP/MFA requirements and least-privilege roles for this actor surface.",
                ],
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [actor.NodeId],
                    RulesApplied = ["privileged-access-internal-human"],
                    DecisionsTaken =
                    [
                        "Internal human actor requires privileged-access verification.",
                    ],
                },
            });
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static bool IsInternalHumanActor(GraphNode actor)
    {
        if (!actor.Properties.TryGetValue("trustOrigin", out string? trustOrigin)
            || !string.Equals(trustOrigin, "Internal", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!actor.Properties.TryGetValue("kind", out string? kind))
            return false;

        return string.Equals(kind, "Human", StringComparison.OrdinalIgnoreCase)
            || string.Equals(kind, "Both", StringComparison.OrdinalIgnoreCase);
    }
}
