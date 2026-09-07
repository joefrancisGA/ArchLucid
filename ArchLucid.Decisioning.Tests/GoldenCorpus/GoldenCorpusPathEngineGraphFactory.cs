using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>DX-28 path-engine golden graphs (identity blast-radius, segmentation semantics, DR/RPO topology).</summary>
internal static class GoldenCorpusPathEngineGraphFactory
{
    internal static GraphSnapshot CreateIdentityBlastRadiusGraph()
    {
        return WrapCaseGraph(
            caseNumber: 38,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "actor-checkout",
                    NodeType = GraphNodeTypes.Actor,
                    Label = "checkout-func",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["kind"] = nameof(ActorKind.Machine),
                        ["trustOrigin"] = nameof(TrustOrigin.Internal),
                    },
                },
                new GraphNode
                {
                    NodeId = "role-contrib-kv",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-contributor-kv",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["terraformType"] = "azurerm_role_assignment",
                        ["roleName"] = "Contributor",
                    },
                },
                new GraphNode
                {
                    NodeId = "kv-pay-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "kv-pay-prod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Storage,
                        [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
                    },
                },
            ],
            edges:
            [
                new GraphEdge
                {
                    FromNodeId = "actor-checkout",
                    ToNodeId = "role-contrib-kv",
                    EdgeType = GraphEdgeTypes.RelatesTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    FromNodeId = "role-contrib-kv",
                    ToNodeId = "kv-pay-prod",
                    EdgeType = GraphEdgeTypes.AppliesTo,
                    Weight = 1.0,
                },
            ]);
    }

    internal static GraphSnapshot CreateSegmentationSemanticsGraph()
    {
        return WrapCaseGraph(
            caseNumber: 39,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "nsg-web",
                    NodeType = GraphNodeTypes.SecurityBaseline,
                    Label = "web-nsg",
                    SourceId = "azurerm_network_security_group.web",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["terraformType"] = "azurerm_network_security_group",
                        ["tf.security_rule"] =
                            "access = allow direction = inbound source_address_prefix = * destination_port_range = 22",
                    },
                },
                new GraphNode
                {
                    NodeId = "subnet-app",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "app-subnet",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Network,
                    },
                },
                new GraphNode
                {
                    NodeId = "sql-pay",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql-pay-prod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Data,
                    },
                },
            ],
            edges:
            [
                new GraphEdge
                {
                    FromNodeId = "nsg-web",
                    ToNodeId = "subnet-app",
                    EdgeType = GraphEdgeTypes.AppliesTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    FromNodeId = "subnet-app",
                    ToNodeId = "sql-pay",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0,
                },
            ]);
    }

    internal static GraphSnapshot CreateDrRpoTopologyGraph()
    {
        return WrapCaseGraph(
            caseNumber: 40,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "req-dr-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "Payment DR",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["text"] = "Payment SQL must meet RPO 15 min.",
                    },
                },
                new GraphNode
                {
                    NodeId = "svc-checkout",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-api",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Compute,
                    },
                },
                new GraphNode
                {
                    NodeId = "sql-pay-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql-pay-prod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Data,
                        ["terraformType"] = "azurerm_mssql_database",
                    },
                },
            ],
            edges:
            [
                new GraphEdge
                {
                    FromNodeId = "req-dr-1",
                    ToNodeId = "svc-checkout",
                    EdgeType = GraphEdgeTypes.RelatesTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    FromNodeId = "svc-checkout",
                    ToNodeId = "sql-pay-prod",
                    EdgeType = GraphEdgeTypes.DependsOn,
                    Weight = 1.0,
                },
            ]);
    }

    private static GraphSnapshot WrapCaseGraph(
        int caseNumber,
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        string caseHex = caseNumber.ToString("D2", System.Globalization.CultureInfo.InvariantCulture);

        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse($"000000{caseHex}-0000-4000-8000-0000000000{caseHex}"),
            ContextSnapshotId = Guid.Parse($"10000000-0000-4000-8000-0000000000{caseHex}"),
            RunId = Guid.Parse($"20000000-0000-4000-8000-0000000000{caseHex}"),
            CreatedUtc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc),
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
            Warnings = [],
        };
    }
}
