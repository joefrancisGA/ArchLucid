using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>AS-042 golden graph: completeness-asserting diagram omits a cited Key Vault declaration.</summary>
internal static class GoldenCorpusDiagramDeclarationOmissionGraphFactory
{
    internal static GraphSnapshot CreateDiagramDeclarationOmissionGraph()
    {
        return WrapCaseGraph(
            caseNumber: 72,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "diagram-trust-boundary:0",
                    NodeType = GraphNodeTypes.TrustBoundary,
                    Label = "Corporate network",
                    SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagramSubgraph,
                    SourceId = "corp",
                },
                new GraphNode
                {
                    NodeId = "diagram-node:api",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Orders API",
                    SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
                    SourceId = "api",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = DiagramExtractionMethods.StructuredParse,
                        ["appSettings"] =
                            "KeyVaultUri=https://payments-kv.vault.azure.net/secrets/db-connection",
                    },
                },
                new GraphNode
                {
                    NodeId = "diagram-node:db",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL Database",
                    SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
                    SourceId = "db",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = DiagramExtractionMethods.StructuredParse,
                    },
                },
                new GraphNode
                {
                    NodeId = "obj-payments-kv",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payments-kv",
                    SourceType = "InfrastructureDeclaration",
                    SourceId = "decl-kv",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["name"] = "payments-kv",
                    },
                },
            ],
            edges:
            [
                new GraphEdge
                {
                    FromNodeId = "diagram-node:api",
                    ToNodeId = "diagram-node:db",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.StructuredParse,
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
