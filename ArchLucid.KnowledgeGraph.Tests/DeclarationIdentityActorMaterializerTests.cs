using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Materialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationIdentityActorMaterializerTests
{
    [Fact]
    public void MaterializeFromNodes_emits_actor_and_trust_boundary_for_k8s_ingress()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        GraphNode ingress = new()
        {
            NodeId = "obj-ingress-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "payments/public",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-ingress",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "ingress",
                ["k8s.name"] = "public",
                ["k8s.namespace"] = "payments",
            },
        };

        IReadOnlyList<GraphNode> materialized =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes([ingress], snapshotId);

        materialized.Should().HaveCount(2);
        GraphNode actor = materialized.Should().ContainSingle(n => n.NodeType == GraphNodeTypes.Actor).Subject;
        actor.Properties["trustOrigin"].Should().Be(nameof(TrustOrigin.External));
        materialized.Should().ContainSingle(n => n.NodeType == GraphNodeTypes.TrustBoundary);
        actor.Properties["declarationSourceNodeId"].Should().Be("obj-ingress-1");
    }

    [Fact]
    public void MaterializeFromNodes_emits_external_actor_for_loadbalancer_service()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        GraphNode service = new()
        {
            NodeId = "obj-svc-lb",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "checkout-lb",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-svc",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "service",
                ["k8s.servicetype"] = "loadbalancer",
                ["k8s.name"] = "checkout-lb",
            },
        };

        IReadOnlyList<GraphNode> materialized =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes([service], snapshotId);

        materialized.Should().ContainSingle(n => n.NodeType == GraphNodeTypes.Actor);
        materialized[0].Properties["trustOrigin"].Should().Be(nameof(TrustOrigin.External));
    }

    [Fact]
    public void MaterializeFromNodes_emits_internal_actor_for_function_app_with_identity()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        GraphNode functionApp = new()
        {
            NodeId = "obj-func-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "payments-func",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-func",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_linux_function_app",
                ["tf.identity_type"] = "SystemAssigned",
            },
        };

        IReadOnlyList<GraphNode> materialized =
            DeclarationIdentityActorMaterializer.MaterializeFromNodes([functionApp], snapshotId);

        materialized.Should().ContainSingle(n => n.NodeType == GraphNodeTypes.Actor);
        materialized[0].Properties["trustOrigin"].Should().Be(nameof(TrustOrigin.Internal));
    }

    [Fact]
    public void MaterializeFromNodes_skips_duplicate_intake_actor_by_label()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        GraphNode declaration = new()
        {
            NodeId = "obj-sa-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "architect",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-dup",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "serviceaccount",
                ["k8s.name"] = "architect",
            },
        };

        GraphNode intakeActor = new()
        {
            NodeId = "intake-1",
            NodeType = GraphNodeTypes.Actor,
            Label = "architect",
            SourceType = "RequestActor",
            SourceId = "other",
        };

        IReadOnlyList<GraphNode> materialized = DeclarationIdentityActorMaterializer.MaterializeFromNodes(
            [declaration, intakeActor],
            snapshotId,
            [intakeActor]);

        materialized.Should().BeEmpty();
    }

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

        actors.Should().HaveCount(2);
        actors.Should().ContainSingle(n => n.NodeType == GraphNodeTypes.Actor);
        actors.Single(n => n.NodeType == GraphNodeTypes.Actor).Properties["trustOrigin"]
            .Should()
            .Be(nameof(TrustOrigin.PublicAnonymous));
        actors.Should().ContainSingle(n => n.NodeType == GraphNodeTypes.TrustBoundary);
    }
}
