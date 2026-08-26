using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Materialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationIdentityActorMaterializerTests
{
    [Fact]
    public void MaterializeFromNodes_returns_empty_for_empty_graph()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        IReadOnlyList<GraphNode> actors =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes([], snapshotId);

        actors.Should().BeEmpty();
    }

    [Fact]
    public void MaterializeFromNodes_emits_actor_for_k8s_service_account()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        GraphNode serviceAccount = new()
        {
            NodeId = "obj-sa-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "payments/worker",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "serviceaccount",
                ["k8s.name"] = "worker",
                ["k8s.namespace"] = "payments",
            },
        };

        IReadOnlyList<GraphNode> actors =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes([serviceAccount], snapshotId);

        actors.Should().ContainSingle();
        GraphNode actor = actors[0];
        actor.NodeType.Should().Be(GraphNodeTypes.Actor);
        actor.Label.Should().Be("worker");
        actor.Properties["kind"].Should().Be(nameof(ActorKind.Machine));
        actor.Properties["trustOrigin"].Should().Be(nameof(TrustOrigin.Internal));
        actor.Properties["origin"].Should().Be(nameof(ActorOrigin.Inferred));
    }

    [Fact]
    public void MaterializeFromNodes_emits_actor_for_aws_iam_role_terraform_type()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        GraphNode role = new()
        {
            NodeId = "obj-role-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "app_role",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-2",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "aws_iam_role",
            },
        };

        IReadOnlyList<GraphNode> actors =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes([role], snapshotId);

        actors.Should().ContainSingle();
        actors[0].Properties["trustOrigin"].Should().Be(nameof(TrustOrigin.Internal));
    }

    [Fact]
    public void MaterializeFromNodes_maps_anonymous_property_to_public_anonymous_trust()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        GraphNode role = new()
        {
            NodeId = "obj-role-2",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "public_role",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-3",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "aws_iam_role",
                ["anonymous"] = "true",
            },
        };

        IReadOnlyList<GraphNode> actors =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes([role], snapshotId);

        actors.Should().ContainSingle();
        actors[0].Properties["trustOrigin"].Should().Be(nameof(TrustOrigin.PublicAnonymous));
    }
}
