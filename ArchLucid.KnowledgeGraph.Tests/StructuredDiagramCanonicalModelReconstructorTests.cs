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
                    Label = "HTTPS data flow",
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
            && edge.TargetId == "db"
            && edge.Id == "e1"
            && edge.Label == "HTTPS data flow");
        model.ExtractionMethod.Should().Be(DiagramExtractionMethods.StructuredParse);
    }

    [Fact]
    public void ReconstructModels_preserves_inferred_edge_provenance_between_asserted_nodes()
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
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        IReadOnlyList<CanonicalObject> canonicalObjects = ArchitectureDiagramCanonicalObjectMapper.Map(
            sourceModel,
            "doc-edge-provenance",
            labelOnlyInferenceConfidence: 0.5);

        IReadOnlyList<StructuredDiagramReconstructedDocument> documents =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(canonicalObjects);

        documents.Should().ContainSingle();
        documents[0].Model.Edges.Should().ContainSingle(edge =>
            edge.SourceId == "api"
            && edge.TargetId == "db"
            && edge.Provenance == ArchitectureDiagramProvenanceKinds.Inferred);
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
    public void ReconstructModels_reads_diagram_node_id_when_persisted_property_key_uses_different_casing()
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
                Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["DIAGRAMNODEID"] = "api",
                },
            },
        ];

        IReadOnlyList<StructuredDiagramReconstructedDocument> documents =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(canonicalObjects);

        documents.Should().ContainSingle().Which.Model.Nodes.Should().ContainSingle(node => node.Id == "api");
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

    [Fact]
    public void ReconstructDocuments_preserves_trust_boundary_subgraph_membership()
    {
        ArchitectureDiagramModelRecord sourceModel = new()
        {
            Subgraphs =
            [
                new ArchitectureDiagramSubgraphRecord
                {
                    Id = "corp",
                    Label = "Corporate network",
                },
            ],
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "Orders API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    SubgraphId = "corp",
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        IReadOnlyList<CanonicalObject> canonicalObjects = ArchitectureDiagramCanonicalObjectMapper.Map(
            sourceModel,
            "doc-mermaid-subgraph",
            labelOnlyInferenceConfidence: 0.7);

        StructuredDiagramReconstructedDocument document =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(canonicalObjects).Should().ContainSingle().Subject;

        document.Model.Subgraphs.Should().ContainSingle(subgraph =>
            subgraph.Id == "corp"
            && subgraph.Label == "Corporate network");
        document.Model.Nodes.Should().ContainSingle(node =>
            node.Id == "api"
            && node.SubgraphId == "corp");
    }

    [Fact]
    public void ReconstructDocuments_preserves_label_when_later_sparse_row_repeats_diagram_node_id()
    {
        List<CanonicalObject> canonicalObjects =
        [
            new CanonicalObject
            {
                ObjectId = "obj-labeled",
                ObjectType = "TopologyResource",
                Name = "API Gateway",
                SourceType = ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType,
                SourceId = "doc-dup-node",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["text"] = "API Gateway",
                    ["diagramNodeId"] = "api",
                    ["diagramNodeKind"] = ArchitectureDiagramNodeKinds.System,
                    ["inferenceConfidence"] = "1",
                },
            },
            new CanonicalObject
            {
                ObjectId = "obj-sparse",
                ObjectType = "TopologyResource",
                Name = string.Empty,
                SourceType = ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType,
                SourceId = "doc-dup-node",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["diagramNodeId"] = "api",
                    ["diagramNodeKind"] = ArchitectureDiagramNodeKinds.System,
                    ["inferenceConfidence"] = "1",
                },
            },
        ];

        ArchitectureDiagramModelRecord model = StructuredDiagramCanonicalModelReconstructor
            .ReconstructDocuments(canonicalObjects)
            .Should()
            .ContainSingle()
            .Subject
            .Model;

        model.Nodes.Should().HaveCount(1);
        model.Nodes[0].Label.Should().Be("API Gateway");
    }
}
