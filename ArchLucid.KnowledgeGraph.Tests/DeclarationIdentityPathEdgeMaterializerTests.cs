using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationIdentityPathEdgeMaterializerTests
{
    private const string PrincipalId = "11111111-2222-3333-4444-555555555555";

    [Fact]
    public void Materialize_emits_iam_path_when_principal_and_scope_match()
    {
        GraphNode identity = BuildTopology(
            "obj-mi",
            "checkout-mi",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_user_assigned_identity",
                ["principalId"] = PrincipalId,
            });
        GraphNode roleAssignment = BuildTopology(
            "obj-role",
            "mi-sql-contributor",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_role_assignment",
                ["roleName"] = "Contributor",
                ["principalId"] = PrincipalId,
                ["declarationTargetResourceId"] = "sql-pay-prod",
            });
        GraphNode sql = BuildDatastore("obj-sql", "sql-pay-prod");
        GraphNode actor = BuildMachineActor("actor-mi", "checkout-mi", identity.NodeId);

        List<GraphNode> nodes = [identity, roleAssignment, sql, actor];

        IReadOnlyList<GraphEdge> edges = DeclarationIdentityPathEdgeMaterializer.Materialize(nodes);

        edges.Should().HaveCount(2);
        edges.Should().Contain(edge =>
            edge.FromNodeId == actor.NodeId
            && edge.ToNodeId == roleAssignment.NodeId
            && edge.EdgeType == GraphEdgeTypes.RelatesTo
            && edge.InferenceSource == GraphEdgeInferenceSources.DeclarationIdentityIamPath);
        edges.Should().Contain(edge =>
            edge.FromNodeId == roleAssignment.NodeId
            && edge.ToNodeId == sql.NodeId
            && edge.EdgeType == GraphEdgeTypes.AppliesTo);

        GraphSnapshot graph = BuildGraphSnapshot(nodes, edges);
        IdentityPathAnalyzer.Analyze(graph).Should().Contain(path => path.HopCount >= 2);
    }

    [Fact]
    public void Materialize_emits_iam_path_for_aws_policy_attachment()
    {
        GraphNode role = BuildTopology(
            "obj-role",
            "pay_runner",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "aws_iam_role",
            });
        GraphNode attachment = BuildTopology(
            "obj-attach",
            "s3_full",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "aws_iam_role_policy_attachment",
                ["principalId"] = "pay_runner",
                ["roleName"] = "AmazonS3FullAccess",
                ["declarationTargetResourceId"] = "pay_bucket",
            });
        GraphNode bucket = BuildDatastore("obj-bucket", "pay_bucket");
        GraphNode actor = BuildMachineActor("actor-role", "pay_runner", role.NodeId);

        IReadOnlyList<GraphEdge> edges = DeclarationIdentityPathEdgeMaterializer.Materialize(
            [role, attachment, bucket, actor]);

        edges.Should().Contain(edge =>
            edge.FromNodeId == actor.NodeId
            && edge.ToNodeId == attachment.NodeId
            && edge.EdgeType == GraphEdgeTypes.RelatesTo);
        edges.Should().Contain(edge =>
            edge.FromNodeId == attachment.NodeId
            && edge.ToNodeId == bucket.NodeId
            && edge.EdgeType == GraphEdgeTypes.AppliesTo);

        GraphSnapshot graph = BuildGraphSnapshot([role, attachment, bucket, actor], edges);
        IdentityPathAnalyzer.Analyze(graph).Should().NotBeEmpty();
    }

    [Fact]
    public void Materialize_emits_no_iam_edges_when_principal_id_missing()
    {
        GraphNode roleAssignment = BuildTopology(
            "obj-role",
            "mi-sql-contributor",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_role_assignment",
                ["roleName"] = "Contributor",
                ["declarationTargetResourceId"] = "sql-pay-prod",
            });
        GraphNode sql = BuildDatastore("obj-sql", "sql-pay-prod");

        DeclarationIdentityPathEdgeMaterializer.Materialize([roleAssignment, sql]).Should().BeEmpty();
    }

    [Fact]
    public void Materialize_emits_no_iam_edges_when_scope_not_on_snapshot()
    {
        GraphNode roleAssignment = BuildTopology(
            "obj-role",
            "mi-sql-contributor",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_role_assignment",
                ["roleName"] = "Contributor",
                ["principalId"] = PrincipalId,
                ["declarationTargetResourceId"] = "missing-sql",
            });

        DeclarationIdentityPathEdgeMaterializer.Materialize([roleAssignment]).Should().BeEmpty();
    }

    [Fact]
    public void Materialize_emits_data_flow_path_for_external_ingress_backend_and_datastore()
    {
        GraphNode ingress = BuildTopology(
            "obj-ingress",
            "public-ingress",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "ingress",
                ["k8s.name"] = "public",
                ["declarationBackendNodeId"] = "app-api",
            });
        GraphNode compute = BuildTopology(
            "obj-app",
            "app-api",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Compute,
                ["connectedToNodeIds"] = "sql-pay",
            });
        GraphNode sql = BuildTopology(
            "obj-sql",
            "sql-pay",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Data,
            });
        GraphNode actor = BuildExternalActor("actor-ingress", "public-ingress", ingress.NodeId);

        IReadOnlyList<GraphEdge> edges = DeclarationIdentityPathEdgeMaterializer.Materialize(
            [ingress, compute, sql, actor]);

        edges.Should().HaveCount(2);
        edges.Should().Contain(edge =>
            edge.FromNodeId == actor.NodeId
            && edge.ToNodeId == compute.NodeId
            && edge.EdgeType == GraphEdgeTypes.ConnectsTo
            && edge.InferenceSource == GraphEdgeInferenceSources.DeclarationIdentityDataFlowPath);
        edges.Should().Contain(edge =>
            edge.FromNodeId == compute.NodeId
            && edge.ToNodeId == sql.NodeId
            && edge.EdgeType == GraphEdgeTypes.ConnectsTo);

        GraphSnapshot graph = BuildGraphSnapshot([ingress, compute, sql, actor], edges);
        DataFlowTrustBoundaryPathAnalyzer.Analyze(graph).Should().ContainSingle();
    }

    private static GraphNode BuildTopology(
        string nodeId,
        string label,
        IReadOnlyDictionary<string, string> properties)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Properties = new Dictionary<string, string>(properties, StringComparer.OrdinalIgnoreCase),
        };
    }

    private static GraphNode BuildDatastore(string nodeId, string label)
    {
        return BuildTopology(
            nodeId,
            label,
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Storage,
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
            });
    }

    private static GraphNode BuildMachineActor(string nodeId, string label, string sourceNodeId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.Actor,
            Label = label,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = nameof(ActorKind.Machine),
                ["trustOrigin"] = nameof(TrustOrigin.Internal),
                ["declarationSourceNodeId"] = sourceNodeId,
            },
        };
    }

    private static GraphNode BuildExternalActor(string nodeId, string label, string sourceNodeId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.Actor,
            Label = label,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["trustOrigin"] = nameof(TrustOrigin.External),
                ["declarationSourceNodeId"] = sourceNodeId,
            },
        };
    }

    private static GraphSnapshot BuildGraphSnapshot(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        return new GraphSnapshot
        {
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
        };
    }
}
