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

        IReadOnlyList<StructuredDiagramReconstructedDocument> documents =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(canonicalObjects);

        documents.Should().ContainSingle();
        ArchitectureDiagramModelRecord model = documents[0].Model;
        documents[0].LabelOnlyInferenceConfidence
            .Should().Be(StructuredDiagramLabelOnlyInferenceDefaults.StandardConfidence);
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

        IReadOnlyList<StructuredDiagramReconstructedDocument> documents =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(canonicalObjects);

        documents.Should().BeEmpty();
    }

    [Fact]
    public void ResolveLabelOnlyInferenceConfidence_uses_minimum_non_asserted_confidence()
    {
        List<CanonicalObject> canonicalObjects =
        [
            new CanonicalObject
            {
                ObjectId = "obj-1",
                ObjectType = "TopologyResource",
                Name = "api",
                SourceType = ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType,
                SourceId = "doc-1",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["diagramNodeId"] = "api",
                    ["inferenceConfidence"] = "0.55",
                },
            },
            new CanonicalObject
            {
                ObjectId = "obj-2",
                ObjectType = "TopologyResource",
                Name = "db",
                SourceType = ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType,
                SourceId = "doc-1",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["diagramNodeId"] = "db",
                    ["inferenceConfidence"] = "0.7",
                },
            },
        ];

        StructuredDiagramCanonicalModelReconstructor.ResolveLabelOnlyInferenceConfidence(canonicalObjects)
            .Should().Be(0.55d);
    }

    [Fact]
    public void ReconstructDocuments_label_only_mermaid_confidence_flows_to_document()
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
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        IReadOnlyList<CanonicalObject> canonicalObjects = ArchitectureDiagramCanonicalObjectMapper.Map(
            sourceModel,
            "doc-mermaid",
            labelOnlyInferenceConfidence: 0.7);

        StructuredDiagramReconstructedDocument document =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(canonicalObjects).Should().ContainSingle().Subject;

        document.LabelOnlyInferenceConfidence.Should().Be(0.7d);
    }
}
