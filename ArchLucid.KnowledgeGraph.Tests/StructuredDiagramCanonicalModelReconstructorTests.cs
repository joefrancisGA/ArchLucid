using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Diagram;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredDiagramCanonicalModelReconstructorTests
{
    [Fact]
    public void ReconstructModels_groups_by_document_and_rebuilds_edges()
    {
        ArchitectureDiagramModelRecord sourceModel = new()
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

        IReadOnlyList<CanonicalObject> canonicalObjects = ArchitectureDiagramCanonicalObjectMapper.Map(
            sourceModel,
            "doc-mermaid-fixture",
            labelOnlyInferenceConfidence: 0.5);

        IReadOnlyList<ArchitectureDiagramModelRecord> models =
            StructuredDiagramCanonicalModelReconstructor.ReconstructModels(canonicalObjects);

        models.Should().ContainSingle();
        ArchitectureDiagramModelRecord model = models[0];
        model.Nodes.Should().HaveCount(2);
        model.Edges.Should().ContainSingle(edge =>
            edge.SourceId == "api"
            && edge.TargetId == "db");
        model.ExtractionMethod.Should().Be(DiagramExtractionMethods.StructuredParse);
    }

    [Fact]
    public void ReconstructModels_ignores_non_structured_diagram_objects()
    {
        List<CanonicalObject> canonicalObjects =
        [
            new CanonicalObject
            {
                ObjectId = "cmp-1",
                ObjectType = "TopologyResource",
                Name = "api",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-1",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            },
        ];

        IReadOnlyList<ArchitectureDiagramModelRecord> models =
            StructuredDiagramCanonicalModelReconstructor.ReconstructModels(canonicalObjects);

        models.Should().BeEmpty();
    }
}
