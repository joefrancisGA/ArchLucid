using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     WK-06 actor slice: IaC identity declarations (WK-08) plus one guided-intake human actor.
///     Privileged-access needs an internal human; WK-08 materializer emits machine actors only.
/// </summary>
internal static class GoldenCorpusActorEngineGraphFactory
{
    internal static readonly Guid SnapshotId = Guid.Parse("00000035-0000-4000-8000-000000000035");
    internal static readonly Guid ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000035");
    internal static readonly Guid RunId = Guid.Parse("20000000-0000-4000-8000-000000000035");
    internal static readonly DateTime CreatedUtc = new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

    internal static GraphSnapshot CreateDeclarationSeededActorGraph()
    {
        GraphNode serviceAccount = new()
        {
            NodeId = "obj-sa-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "payments/worker",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-sa-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "serviceaccount",
                ["k8s.name"] = "worker",
                ["k8s.namespace"] = "payments",
            },
        };

        GraphNode publicRole = new()
        {
            NodeId = "obj-role-public",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "public_role",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-role-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "aws_iam_role",
                ["anonymous"] = "true",
            },
        };

        GraphNode intakeHuman = new()
        {
            NodeId = "intake-human-1",
            NodeType = GraphNodeTypes.Actor,
            Label = "architect",
            SourceType = "GuidedIntake",
            SourceId = "intake-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = nameof(ActorKind.Human),
                ["trustOrigin"] = nameof(TrustOrigin.Internal),
            },
        };

        List<GraphNode> declarationNodes = [serviceAccount, publicRole];
        IReadOnlyList<GraphNode> inferredActors =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes(declarationNodes, SnapshotId);

        List<GraphNode> nodes = [.. declarationNodes, intakeHuman, .. inferredActors];

        return new GraphSnapshot
        {
            GraphSnapshotId = SnapshotId,
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            CreatedUtc = CreatedUtc,
            Nodes = nodes,
            Edges = [],
            Warnings = [],
        };
    }

    internal static GraphSnapshot CreateLegacyMixedOriginActorGraph()
    {
        GraphNode externalActor = new()
        {
            NodeId = "external-actor-1",
            NodeType = GraphNodeTypes.Actor,
            Label = "anonymous_client",
            SourceType = "GuidedIntake",
            SourceId = "intake-external",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = nameof(ActorKind.Human),
                ["trustOrigin"] = nameof(TrustOrigin.PublicAnonymous),
            },
        };

        GraphNode intakeHuman = new()
        {
            NodeId = "intake-human-1",
            NodeType = GraphNodeTypes.Actor,
            Label = "architect",
            SourceType = "GuidedIntake",
            SourceId = "intake-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = nameof(ActorKind.Human),
                ["trustOrigin"] = nameof(TrustOrigin.Internal),
            },
        };

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.Parse("00000036-0000-4000-8000-000000000036"),
            ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000036"),
            RunId = Guid.Parse("20000000-0000-4000-8000-000000000036"),
            CreatedUtc = CreatedUtc,
            Nodes = [externalActor, intakeHuman],
            Edges = [],
            Warnings = [],
        };
    }
}
