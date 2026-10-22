using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Diagram;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredDiagramGraphMergerTests
{
    [Fact]
    public void Merge_deduplicates_connects_to_edges_when_multiple_documents_share_equivalent_endpoints()
    {
        ArchitectureDiagramModelRecord sharedTopology = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API Gateway",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "db",
                    Label = "SQL Database",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "api",
                    TargetId = "db",
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(
                sharedTopology,
                "doc-merge-a",
                labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(
                sharedTopology,
                "doc-merge-b",
                labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            ProjectId = "project-merge-dedup",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Edges
            .Where(edge => edge.EdgeType == GraphEdgeTypes.ConnectsTo)
            .Should()
            .ContainSingle(edge =>
                edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db");

        result.Nodes
            .Where(node => node.NodeId.StartsWith("diagram-node:", StringComparison.Ordinal))
            .Should()
            .HaveCount(2);
    }
}
