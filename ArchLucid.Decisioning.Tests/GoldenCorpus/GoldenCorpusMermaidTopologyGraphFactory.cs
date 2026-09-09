using ArchLucid.ContextIngestion;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
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

        return WrapCaseGraph(70, nodes, build.Edges);
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
