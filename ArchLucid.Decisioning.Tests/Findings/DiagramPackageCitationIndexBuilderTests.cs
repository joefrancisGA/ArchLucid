using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramPackageCitationIndexBuilderTests
{
    [Fact]
    public void FromGraphSnapshot_indexes_structured_diagram_nodes_and_edges()
    {
        GraphSnapshot graphSnapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "diagram-node:api",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
                    SourceId = "api",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-golden-70-mermaid",
                    },
                },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "diagram-edge:edge-0",
                    FromNodeId = "diagram-node:api",
                    ToNodeId = "diagram-node:db",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [StructuredDiagramGraphPropertyKeys.DiagramEdgeId] = "edge-0",
                        [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-golden-70-mermaid",
                    },
                },
            ],
        };

        DiagramPackageCitationIndex packageIndex = DiagramPackageCitationIndexBuilder.FromGraphSnapshot(graphSnapshot);

        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(
                [DiagramEvidenceCitationRefs.Format("doc-golden-70-mermaid", "api")],
                packageIndex)
            .Should().BeTrue();

        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(
                [DiagramEvidenceCitationRefs.Format("doc-golden-70-mermaid", "edge-0")],
                packageIndex)
            .Should().BeTrue();

        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(
                [DiagramEvidenceCitationRefs.Format("doc-golden-70-mermaid", "missing")],
                packageIndex)
            .Should().BeFalse();
    }
}
