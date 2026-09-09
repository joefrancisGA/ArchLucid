using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>DX-24 / DX-25 golden graphs (dangling declaration refs, requirement SKU tier).</summary>
internal static class GoldenCorpusDxEngineGraphFactory
{
    internal static GraphSnapshot CreateDanglingDeclarationReferenceGraph()
    {
        return WrapCaseGraph(
            caseNumber: 41,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "func-checkout",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-func",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["appSettings"] =
                            "KeyVaultUri=https://payments-kv.vault.azure.net/secrets/db-connection",
                    },
                },
            ],
            edges: []);
    }

    internal static GraphSnapshot CreateRequirementSkuTierGraph()
    {
        return WrapCaseGraph(
            caseNumber: 42,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "req-redundancy-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "Payment SQL",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["text"] = "Payment SQL must be zone-redundant.",
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
                        ["sku"] = "Standard_LRS",
                    },
                },
            ],
            edges:
            [
                new GraphEdge
                {
                    FromNodeId = "req-redundancy-1",
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
