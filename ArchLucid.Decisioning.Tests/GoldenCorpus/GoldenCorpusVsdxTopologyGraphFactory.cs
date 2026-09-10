using System.IO.Compression;
using System.Text;

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
///     Builds golden-corpus graphs from vsdx context documents (AS-035).
/// </summary>
internal static class GoldenCorpusVsdxTopologyGraphFactory
{
    internal const string Case71DocumentId = "doc-golden-71-vsdx";

    internal static readonly Guid Case71RunId = Guid.Parse("20000000-0000-4000-8000-000000000071");

    internal static readonly Guid Case71ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000071");

    private const string Case71PageXml = """
        <?xml version="1.0" encoding="utf-8"?>
        <PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main">
          <Shapes>
            <Shape ID="1" NameU="API Gateway" Type="Shape">
              <Text>API Gateway</Text>
            </Shape>
            <Shape ID="2" NameU="SQL Database" Type="Shape">
              <Text>SQL Database</Text>
            </Shape>
            <Shape ID="3" Type="Shape" />
          </Shapes>
          <Connects>
            <Connect FromSheet="1" ToSheet="2"/>
          </Connects>
        </PageContents>
        """;

    private static readonly VsdxContextDocumentParser VsdxParser = new();

    private static readonly GraphNodeFactory NodeFactory = new();

    internal static async Task<GraphSnapshot> CreateCase71VsdxTopologyGraphAsync()
    {
        byte[] packageBytes = BuildMinimalVsdxPackage(Case71PageXml);

        ContextDocumentReference document = new()
        {
            DocumentId = Case71DocumentId,
            Name = "topology.vsdx",
            ContentType = SupportedContextDocumentContentTypes.VisioVsdx,
            Content = Convert.ToBase64String(packageBytes),
        };

        List<CanonicalObject> objects = (await VsdxParser.ParseAsync(document, CancellationToken.None)).ToList();

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Case71ContextSnapshotId,
            RunId = Case71RunId,
            ProjectId = "golden-case-71",
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

        GraphSnapshot graph = WrapCaseGraph(71, nodes, build.Edges);
        ApplyCase71DiagramEvidenceBindings(graph);

        return graph;
    }

    internal static void ApplyCase71DiagramEvidenceBindings(GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        foreach (GraphNode node in graph.Nodes)
        {
            if (IsDiagramBackedNode(node))
            {
                node.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = Case71DocumentId;
            }
        }

        const string subscriptionId = "00000000-0000-4000-8000-000000000071";

        StampArmResourceId(
            graph,
            "diagram-node:1",
            $"/subscriptions/{subscriptionId}/resourceGroups/rg-golden-71/providers/Microsoft.ApiManagement/service/api-gateway-golden-71");

        StampArmResourceId(
            graph,
            "diagram-node:2",
            $"/subscriptions/{subscriptionId}/resourceGroups/rg-golden-71/providers/Microsoft.Sql/servers/sql-database-golden-71");
    }

    private static bool IsDiagramBackedNode(GraphNode node)
    {
        return string.Equals(node.SourceType, StructuredDiagramGraphSourceTypes.StructuredDiagram, StringComparison.Ordinal)
            || node.NodeId.StartsWith("diagram-node:", StringComparison.Ordinal);
    }

    private static void StampArmResourceId(GraphSnapshot graph, string nodeId, string armResourceId)
    {
        GraphNode? node = graph.Nodes.FirstOrDefault(candidate =>
            string.Equals(candidate.NodeId, nodeId, StringComparison.OrdinalIgnoreCase));

        if (node is null)
        {
            return;
        }

        node.Properties["armResourceId"] = armResourceId;
        node.Properties["resourceId"] = armResourceId;
    }

    private static byte[] BuildMinimalVsdxPackage(string pageXml)
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry pageEntry = archive.CreateEntry("visio/pages/page1.xml");
            using (StreamWriter writer = new(pageEntry.Open(), Encoding.UTF8))
            {
                writer.Write(pageXml);
            }
        }

        return stream.ToArray();
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
