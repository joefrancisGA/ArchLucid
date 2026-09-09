using ArchLucid.ContextIngestion;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     Builds golden-corpus graphs from mermaid context documents (AS-034).
/// </summary>
internal static class GoldenCorpusMermaidTopologyGraphFactory
{
    internal const string Case70DocumentId = "doc-golden-70-mermaid";

    internal static readonly Guid Case70RunId = Guid.Parse("20000000-0000-4000-8000-000000000070");

    internal static readonly Guid Case70ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000070");

    private static readonly MermaidContextDocumentParser MermaidParser = new();

    private static readonly GraphNodeFactory NodeFactory = new();

    internal static async Task<GraphSnapshot> CreateCase70MermaidTrustBoundaryTopologyGraphAsync()
    {
        const string mermaid = """
            flowchart TB
                subgraph corp["Corporate network"]
                    api["Orders API"]
                    db["SQL Database"]
                end
                user["Internet user"]
                user --> api
                api -->|"queries"| db
            """;

        ContextDocumentReference document = new()
        {
            DocumentId = Case70DocumentId,
            Name = "topology.mmd",
            ContentType = SupportedContextDocumentContentTypes.Mermaid,
            Content = mermaid,
        };

        List<CanonicalObject> objects = (await MermaidParser.ParseAsync(document, CancellationToken.None)).ToList();

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Case70ContextSnapshotId,
            RunId = Case70RunId,
            ProjectId = "golden-case-70",
            CanonicalObjects = objects,
        };

        DefaultGraphBuilder builder = new(
            NodeFactory,
            new DefaultGraphEdgeInferer(),
            new StructuredDiagramGraphMerger(new ArchitectureDiagramToGraphCompiler()));

        GraphBuildResult build = await builder.BuildAsync(snapshot, CancellationToken.None);

        List<GraphNode> nodes = build.Nodes
            .Where(static node => !string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase))
            .ToList();

        GraphSnapshot graph = WrapCaseGraph(70, nodes, build.Edges);
        ApplyCase70DiagramEvidenceBindings(graph);

        return graph;
    }

    internal static void ApplyCase70DiagramEvidenceBindings(GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        foreach (GraphNode node in graph.Nodes)
        {
            if (IsDiagramBackedNode(node))
            {
                node.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = Case70DocumentId;
            }
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Properties is null)
            {
                continue;
            }

            if (!edge.Properties.ContainsKey(StructuredDiagramGraphPropertyKeys.DiagramEdgeId))
            {
                continue;
            }

            edge.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = Case70DocumentId;
        }

        GraphNode? userNode = graph.Nodes.FirstOrDefault(node =>
            string.Equals(node.NodeId, "diagram-node:user", StringComparison.OrdinalIgnoreCase));

        if (userNode is not null)
        {
            userNode.Properties["trustOrigin"] = nameof(TrustOrigin.External);
        }

        GraphNode? dbNode = graph.Nodes.FirstOrDefault(node =>
            string.Equals(node.NodeId, "diagram-node:db", StringComparison.OrdinalIgnoreCase));

        if (dbNode is not null)
        {
            dbNode.Properties["category"] = GraphTopologyCategories.Data;
        }

        EnsureUserToApiEdge(graph);
    }

    private static bool IsDiagramBackedNode(GraphNode node)
    {
        return string.Equals(node.SourceType, StructuredDiagramGraphSourceTypes.StructuredDiagram, StringComparison.Ordinal)
            || node.NodeId.StartsWith("diagram-node:", StringComparison.Ordinal);
    }

    private static void EnsureUserToApiEdge(GraphSnapshot graph)
    {
        const string userNodeId = "diagram-node:user";
        const string apiNodeId = "diagram-node:api";

        if (graph.Edges.Any(edge =>
                string.Equals(edge.FromNodeId, userNodeId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(edge.ToNodeId, apiNodeId, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "diagram-edge:user-api-golden-70",
            FromNodeId = userNodeId,
            ToNodeId = apiNodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Weight = 0.7,
            InferenceSource = "structured-parse",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = "StructuredParse",
                [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                    StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = Case70DocumentId,
            },
        });
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
