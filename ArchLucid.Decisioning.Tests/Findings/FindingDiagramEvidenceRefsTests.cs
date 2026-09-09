using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingDiagramEvidenceRefsTests
{
    private const string EvidenceItemId = "evidence-mermaid-1";

    [Fact]
    public void CollectFromNodeIds_appends_diagram_citation_for_structured_diagram_node()
    {
        GraphSnapshot graphSnapshot = BuildDiagramNodeFixture("api");

        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectFromNodeIds(
            graphSnapshot,
            ["diagram-node:api"]);

        evidenceRefs.Should().ContainSingle()
            .Which.Should().Be(DiagramEvidenceCitationRefs.Format(EvidenceItemId, "api"));
    }

    [Fact]
    public void CollectFromNodeIds_appends_diagram_citation_for_bound_inventory_node()
    {
        GraphSnapshot graphSnapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "obj-sql-inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql-prod",
                    SourceType = "canonical-object",
                    SourceId = "obj-sql-inv-1",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId] = "sql",
                        [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = EvidenceItemId,
                    },
                },
            ],
        };

        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectFromNodeIds(
            graphSnapshot,
            ["obj-sql-inv-1"]);

        evidenceRefs.Should().ContainSingle()
            .Which.Should().Be(DiagramEvidenceCitationRefs.Format(EvidenceItemId, "sql"));
    }

    [Fact]
    public void CollectFromNodeIds_skips_non_diagram_nodes()
    {
        GraphSnapshot graphSnapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "actor-ingress",
                    NodeType = GraphNodeTypes.Actor,
                    Label = "ingress",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal),
                },
            ],
        };

        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectFromNodeIds(
            graphSnapshot,
            ["actor-ingress"]);

        evidenceRefs.Should().BeEmpty();
    }

    private static GraphSnapshot BuildDiagramNodeFixture(string shapeId)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = $"diagram-node:{shapeId}",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = shapeId,
                    SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
                    SourceId = shapeId,
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = EvidenceItemId,
                        [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = "StructuredParse",
                    },
                },
            ],
        };
    }
}
