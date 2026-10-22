using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredDiagramGraphMergerTests
{
    [Fact]
    public void Merge_uses_latest_diagram_label_when_multiple_documents_compile_the_same_node_id()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "Legacy API label",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = new()
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
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-label-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-label-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            ProjectId = "project-label-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "diagram-node:api" && node.Label == "API Gateway");
    }

    [Fact]
    public void Merge_trims_surrounding_whitespace_on_label_when_later_document_overwrites_node()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "Legacy API label",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "  API Gateway  ",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-label-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-label-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeef"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555556"),
            ProjectId = "project-label-trim-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "diagram-node:api" && node.Label == "API Gateway");
    }

    [Fact]
    public void Merge_uses_latest_diagram_node_type_when_multiple_documents_compile_the_same_node_id()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "actor",
                    Label = "Operator",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "actor",
                    Label = "Operator",
                    Kind = ArchitectureDiagramNodeKinds.User,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-type-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-type-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001"),
            RunId = Guid.Parse("33333333-4444-5555-6666-777777777777"),
            ProjectId = "project-node-type-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Nodes
            .Should()
            .ContainSingle(node =>
                node.NodeId == "diagram-node:actor"
                && node.NodeType == GraphNodeTypes.Actor);
    }

    [Fact]
    public void Merge_uses_latest_diagram_properties_and_reasoning_when_multiple_documents_compile_the_same_node_id()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "svc",
                    Label = "Service",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "svc",
                    Label = "Service",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-props-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-props-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("dddddddd-eeee-ffff-0000-111111111111"),
            RunId = Guid.Parse("44444444-5555-6666-7777-888888888888"),
            ProjectId = "project-properties-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphNode merged = result.Nodes.Should().ContainSingle(node => node.NodeId == "diagram-node:svc").Subject;
        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-props-b");
        merged.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
        merged.ReasoningTrace.Should().Contain("asserted diagram source");
    }

    [Fact]
    public void Merge_uses_latest_diagram_edge_properties_and_reasoning_when_multiple_documents_share_equivalent_endpoints()
    {
        ArchitectureDiagramModelRecord inferredTopology = new()
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

        ArchitectureDiagramModelRecord assertedTopology = new()
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
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredTopology, "doc-edge-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedTopology, "doc-edge-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("eeeeeeee-ffff-0000-1111-222222222222"),
            RunId = Guid.Parse("55555555-6666-7777-8888-999999999999"),
            ProjectId = "project-edge-properties-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-edge-b");
        merged.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
        merged.ReasoningTrace.Should().Contain("asserted diagram source");
        merged.InferenceSource.Should().Be(GraphEdgeInferenceSources.StructuredParse);
    }

    [Fact]
    public void Merge_uses_latest_diagram_edge_weight_when_multiple_documents_share_equivalent_endpoints()
    {
        ArchitectureDiagramModelRecord inferredTopology = new()
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
                new ArchitectureDiagramNodeRecord
                {
                    Id = "db",
                    Label = "SQL Database",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
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

        ArchitectureDiagramModelRecord assertedTopology = new()
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
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredTopology, "doc-edge-weight-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedTopology, "doc-edge-weight-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("ffffffff-0000-1111-2222-333333333333"),
            RunId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa"),
            ProjectId = "project-edge-weight-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.Weight.Should().Be(1d);
        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-edge-weight-b");
    }

    [Fact]
    public void Merge_uses_latest_diagram_edge_label_when_multiple_documents_share_equivalent_endpoints()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
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
                    Label = "legacy link",
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = new()
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

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-edge-label-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-edge-label-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            RunId = Guid.Parse("77777777-8888-9999-aaaa-bbbbbbbbbbbb"),
            ProjectId = "project-edge-label-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db"
                && edge.Label == "HTTPS data flow");
    }

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

    [Fact]
    public void Merge_uses_latest_diagram_edge_id_when_multiple_documents_share_equivalent_endpoints()
    {
        ArchitectureDiagramModelRecord inferredTopology = new()
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
                    Id = "edge-first",
                    SourceId = "api",
                    TargetId = "db",
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord assertedTopology = new()
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
                    Id = "edge-second",
                    SourceId = "api",
                    TargetId = "db",
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredTopology, "doc-edge-id-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedTopology, "doc-edge-id-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-111111111111"),
            RunId = Guid.Parse("88888888-9999-aaaa-bbbb-cccccccccccc"),
            ProjectId = "project-edge-id-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.EdgeId.Should().Be("diagram-edge:edge-second");
        merged.Properties[StructuredDiagramGraphPropertyKeys.DiagramEdgeId].Should().Be("edge-second");
        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-edge-id-b");
    }

    [Fact]
    public void Merge_deduplicates_canonical_bindings_when_multiple_documents_bind_the_same_inventory_node()
    {
        const string armSqlId =
            "/subscriptions/11111111-2222-3333-4444-555555555555/resourceGroups/pay/providers/Microsoft.Sql/servers/pay-sql";

        GraphNode inventorySql = new()
        {
            NodeId = "obj-sql-inv-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "pay-sql",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["azureResourceId"] = armSqlId,
            },
        };

        ArchitectureDiagramModelRecord diagramModel = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "sql",
                    Label = armSqlId,
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-bind-a", labelOnlyInferenceConfidence: 0.7));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-bind-b", labelOnlyInferenceConfidence: 0.7));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
            RunId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
            ProjectId = "project-binding-dedup",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, [inventorySql]);

        result.CanonicalBindings.Should().ContainSingle(binding =>
            binding.CanonicalGraphNodeId == "obj-sql-inv-1"
            && binding.DiagramSourceId == "sql");

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes([inventorySql], result.CanonicalBindings);
        inventorySql.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId]
            .Should().Be("doc-bind-a");
    }

    [Fact]
    public void Merge_deduplicates_remapped_edges_when_inventory_node_id_has_surrounding_whitespace()
    {
        const string armSqlId =
            "/subscriptions/11111111-2222-3333-4444-555555555555/resourceGroups/pay/providers/Microsoft.Sql/servers/pay-sql";

        GraphNode inventoryApi = new()
        {
            NodeId = "  obj-api-inv-1  ",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "API Gateway",
        };

        GraphNode inventorySql = new()
        {
            NodeId = "  obj-sql-inv-1  ",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "pay-sql",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["azureResourceId"] = armSqlId,
            },
        };

        ArchitectureDiagramModelRecord diagramModel = new()
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
                new ArchitectureDiagramNodeRecord
                {
                    Id = "sql",
                    Label = armSqlId,
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "api",
                    TargetId = "sql",
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-padded-bind-a", labelOnlyInferenceConfidence: 0.7));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-padded-bind-b", labelOnlyInferenceConfidence: 0.7));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffff01"),
            RunId = Guid.Parse("22222222-3333-4444-5555-666666666667"),
            ProjectId = "project-padded-inventory-edge-dedup",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, [inventoryApi, inventorySql]);

        result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "obj-api-inv-1"
                && edge.ToNodeId == "obj-sql-inv-1");

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [inventorySql],
            result.CanonicalBindings);

        inventorySql.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId].Should().Be("sql");

        result.Nodes.Should().NotContain(node => node.NodeId == "obj-api-inv-1");

        GraphSnapshot mergeOnlyGraph = new()
        {
            Nodes = [.. result.Nodes],
            Edges = [.. result.Edges],
        };

        mergeOnlyGraph.GetOutgoingTargets("obj-api-inv-1", GraphEdgeTypes.ConnectsTo).Should().BeEmpty();

        GraphSnapshot withBindTargets = new()
        {
            Nodes = [inventoryApi, inventorySql, .. result.Nodes],
            Edges = [.. result.Edges],
        };

        withBindTargets.GetOutgoingTargets("obj-api-inv-1", GraphEdgeTypes.ConnectsTo)
            .Should()
            .ContainSingle(node => string.Equals(node.NodeId.Trim(), "obj-sql-inv-1", StringComparison.Ordinal));
    }

    [Fact]
    public void Merge_preserves_diagram_label_when_later_document_omits_node_label()
    {
        ArchitectureDiagramModelRecord labeledDocument = new()
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
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord sparseDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = string.Empty,
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(labeledDocument, "doc-label-keep-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(sparseDocument, "doc-label-keep-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            RunId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
            ProjectId = "project-label-sparse",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "diagram-node:api" && node.Label == "API Gateway");
    }

    [Fact]
    public void Merge_preserves_asserted_edge_weight_when_later_inferred_document_recompiles_same_endpoints()
    {
        ArchitectureDiagramModelRecord assertedTopology = new()
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

        ArchitectureDiagramModelRecord inferredTopology = new()
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
                new ArchitectureDiagramNodeRecord
                {
                    Id = "db",
                    Label = "SQL Database",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
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

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedTopology, "doc-weight-keep-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredTopology, "doc-weight-keep-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000"),
            RunId = Guid.Parse("dddddddd-eeee-ffff-0000-111111111111"),
            ProjectId = "project-edge-weight-keep",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.Weight.Should().Be(1d);
    }

    [Fact]
    public void Merge_preserves_asserted_node_inference_confidence_when_later_inferred_document_recompiles_same_node_id()
    {
        ArchitectureDiagramModelRecord assertedDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "svc",
                    Label = "Service",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord inferredDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "svc",
                    Label = "Service",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedDocument, "doc-node-conf-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredDocument, "doc-node-conf-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("eeeeeeee-ffff-0000-1111-222222222222"),
            RunId = Guid.Parse("ffffffff-0000-1111-2222-333333333333"),
            ProjectId = "project-node-confidence-keep",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphNode merged = result.Nodes.Should().ContainSingle(node => node.NodeId == "diagram-node:svc").Subject;
        merged.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
        merged.ReasoningTrace.Should().Contain("asserted diagram source");
    }

    [Fact]
    public void Merge_preserves_asserted_source_evidence_when_later_inferred_document_recompiles_same_node_id()
    {
        ArchitectureDiagramModelRecord assertedDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "svc",
                    Label = "Service",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord inferredDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "svc",
                    Label = "Service",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedDocument, "doc-node-evidence-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredDocument, "doc-node-evidence-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            RunId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
            ProjectId = "project-node-evidence-keep",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphNode merged = result.Nodes.Should().ContainSingle(node => node.NodeId == "diagram-node:svc").Subject;
        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-node-evidence-a");
    }

    [Fact]
    public void Merge_preserves_asserted_edge_inference_confidence_when_later_inferred_document_recompiles_same_endpoints()
    {
        ArchitectureDiagramModelRecord assertedTopology = new()
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

        ArchitectureDiagramModelRecord inferredTopology = new()
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
                new ArchitectureDiagramNodeRecord
                {
                    Id = "db",
                    Label = "SQL Database",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
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

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedTopology, "doc-edge-conf-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredTopology, "doc-edge-conf-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("33333333-4444-5555-6666-777777777777"),
            RunId = Guid.Parse("44444444-5555-6666-7777-888888888888"),
            ProjectId = "project-edge-confidence-keep",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.Weight.Should().Be(1d);
        merged.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-edge-conf-a");
        merged.ReasoningTrace.Should().Contain("asserted diagram source");
    }

    [Fact]
    public void Merge_coalesces_nodes_when_compile_result_node_ids_differ_only_by_surrounding_whitespace()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "First",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "Second",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-node-key-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-node-key-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed1"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555557"),
            ProjectId = "project-node-id-key-trim",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedDuplicateNodeIdTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphNode merged = result.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "diagram-node:api")
            .Subject;
        merged.Label.Should().Be("Second");
    }

    [Fact]
    public void Merge_coalesces_node_properties_when_incoming_property_keys_differ_only_by_surrounding_whitespace()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-node-prop-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-node-prop-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed2"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555558"),
            ProjectId = "project-node-property-key-trim",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedDiagramPropertyKeyTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphNode merged = result.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "diagram-node:api")
            .Subject;

        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-node-prop-b");
        merged.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);

        GraphNodePropertyReader.TryGetPropertyValue(
                merged.Properties,
                StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId,
                out string? evidence)
            .Should()
            .BeTrue();
        evidence.Should().Be("doc-node-prop-b");
    }

    [Fact]
    public void Merge_coalesces_edge_properties_when_incoming_property_keys_differ_only_by_surrounding_whitespace()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "db",
                    Label = "DB",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = firstDocument;

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-edge-prop-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-edge-prop-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed3"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555559"),
            ProjectId = "project-edge-property-key-trim",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedDiagramEdgePropertyKeyTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-edge-prop-b");
        merged.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);

        GraphNodePropertyReader.TryGetPropertyValue(
                merged.Properties,
                StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId,
                out string? evidence)
            .Should()
            .BeTrue();
        evidence.Should().Be("doc-edge-prop-b");
    }

    [Fact]
    public void Merge_skips_weaker_incoming_source_evidence_when_existing_metadata_uses_padded_inference_confidence_key()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = firstDocument;

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-conf-key-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-conf-key-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed4"),
            RunId = Guid.Parse("11111111-2222-3333-4444-55555555555a"),
            ProjectId = "project-inference-confidence-key-trim",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedInferenceConfidencePropertyKeyTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphNode merged = result.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "diagram-node:api")
            .Subject;

        merged.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId].Should().Be("doc-conf-key-a");
        merged.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
    }

    [Fact]
    public void Merge_collapses_legacy_padded_inference_confidence_key_after_coalesce()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = firstDocument;

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-conf-collapse-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-conf-collapse-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed5"),
            RunId = Guid.Parse("11111111-2222-3333-4444-55555555555b"),
            ProjectId = "project-inference-confidence-key-collapse",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedThenStrongerInferenceConfidenceTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphNode merged = result.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "diagram-node:api")
            .Subject;

        merged.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.InferenceConfidence,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);

        GraphNodePropertyReader.TryGetPropertyValue(
                merged.Properties,
                StructuredDiagramGraphPropertyKeys.InferenceConfidence,
                out string? confidence)
            .Should()
            .BeTrue();
        confidence.Should().Be("1");
        merged.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
    }

    [Fact]
    public void Merge_coalesces_edges_when_directed_pair_key_differs_only_by_endpoint_or_type_padding()
    {
        ArchitectureDiagramModelRecord firstDocument = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "db",
                    Label = "DB",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        ArchitectureDiagramModelRecord secondDocument = firstDocument;

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(firstDocument, "doc-edge-key-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(secondDocument, "doc-edge-key-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed2"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555558"),
            ProjectId = "project-edge-key-trim",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedDuplicateEdgeKeyTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.EdgeId.Should().Be("diagram-edge:padded-second");
    }

    [Fact]
    public void Merge_normalizes_padded_compile_warnings_and_dedupes_trim_equal_entries()
    {
        ArchitectureDiagramModelRecord diagramModel = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed6"),
            RunId = Guid.Parse("11111111-2222-3333-4444-55555555555c"),
            ProjectId = "project-compile-warning-trim",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedDuplicateCompileWarningTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Warnings.Should().ContainSingle().Which.Should().Be("diagram compile notice");
    }

    [Fact]
    public void Merge_retains_distinct_compile_warnings_when_every_document_compile_snapshot_is_empty()
    {
        ArchitectureDiagramModelRecord diagramModel = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-only-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-only-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed7"),
            RunId = Guid.Parse("11111111-2222-3333-4444-55555555555d"),
            ProjectId = "project-warnings-only-merge",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new WarningsOnlyEmptySnapshotTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Nodes.Should().BeEmpty();
        result.Edges.Should().BeEmpty();
        result.Warnings.Should().Equal("diagram compile notice A", "diagram compile notice B");
    }

    [Fact]
    public void Merge_deduplicates_compile_warnings_when_messages_differ_only_by_casing()
    {
        ArchitectureDiagramModelRecord diagramModel = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-case-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-case-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed8"),
            RunId = Guid.Parse("11111111-2222-3333-4444-55555555555e"),
            ProjectId = "project-compile-warning-case-dedupe",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new CaseVariantCompileWarningTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Warnings.Should().ContainSingle().Which.Should().Be("Diagram compile notice");
    }

    [Fact]
    public void Merge_skips_whitespace_only_compile_warnings_on_multi_document_merge()
    {
        ArchitectureDiagramModelRecord diagramModel = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-blank-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-blank-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeed9"),
            RunId = Guid.Parse("11111111-2222-3333-4444-55555555555f"),
            ProjectId = "project-compile-warning-blank-skip",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new WhitespaceOnlyCompileWarningTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Warnings.Should().Equal("diagram compile notice A", "diagram compile notice B");
    }

    [Fact]
    public void Merge_skips_null_compile_warning_entries_on_multi_document_merge()
    {
        ArchitectureDiagramModelRecord diagramModel = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Asserted,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-null-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-warn-null-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeda"),
            RunId = Guid.Parse("11111111-2222-3333-4444-555555555560"),
            ProjectId = "project-compile-warning-null-skip",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new NullCompileWarningTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.Warnings.Should().Equal("diagram compile notice A", "diagram compile notice B");
    }

    [Fact]
    public void Merge_deduplicates_canonical_bindings_when_canonical_graph_node_id_differs_only_by_surrounding_whitespace()
    {
        ArchitectureDiagramModelRecord diagramModel = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "sql",
                    Label = "pay-sql",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        List<CanonicalObject> canonicalObjects = [];
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-binding-key-a", labelOnlyInferenceConfidence: 0.7));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(diagramModel, "doc-binding-key-b", labelOnlyInferenceConfidence: 0.7));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffff03"),
            RunId = Guid.Parse("22222222-3333-4444-5555-666666666668"),
            ProjectId = "project-binding-key-trim",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger =
            new StructuredDiagramGraphMerger(new PaddedCanonicalBindingDedupeTestCompiler());
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        result.CanonicalBindings.Should().ContainSingle(binding =>
            binding.CanonicalGraphNodeId == "obj-sql-inv-1"
            && binding.DiagramSourceId == "sql"
            && binding.DiagramGraphNodeId == "diagram-node:sql");
    }

    [Fact]
    public void Merge_does_not_populate_schema_v1_top_level_provenance_kind_or_declared_connection_id_on_structured_diagram_edges()
    {
        ArchitectureDiagramModelRecord inferredTopology = new()
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

        ArchitectureDiagramModelRecord assertedTopology = new()
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
            ArchitectureDiagramCanonicalObjectMapper.Map(inferredTopology, "doc-schema-v1-a", labelOnlyInferenceConfidence: 0.5));
        canonicalObjects.AddRange(
            ArchitectureDiagramCanonicalObjectMapper.Map(assertedTopology, "doc-schema-v1-b", labelOnlyInferenceConfidence: 0.5));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-111111111111"),
            RunId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa"),
            ProjectId = "project-schema-v1-edge-fields",
            CanonicalObjects = canonicalObjects,
        };

        StructuredDiagramGraphMerger merger = GraphMaterializationTestHelpers.CreateStructuredDiagramGraphMerger();
        StructuredDiagramGraphMergeResult result = merger.Merge(snapshot, []);

        GraphEdge merged = result.Edges
            .Should()
            .ContainSingle(edge =>
                edge.EdgeType == GraphEdgeTypes.ConnectsTo
                && edge.FromNodeId == "diagram-node:api"
                && edge.ToNodeId == "diagram-node:db")
            .Subject;

        merged.ProvenanceKind.Should().BeNull();
        merged.DeclaredConnectionId.Should().BeNull();
        merged.InferenceSource.Should().Be(GraphEdgeInferenceSources.StructuredParse);
        merged.Properties.Should().ContainKey(StructuredDiagramGraphPropertyKeys.ProvenanceKind);
    }

    private sealed class NullCompileWarningTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;

            if (compileCount == 1)
            {
                return new StructuredDiagramGraphCompileResult
                {
                    Warnings = ["diagram compile notice A", null!],
                    Snapshot = new GraphSnapshot(),
                };
            }

            return new StructuredDiagramGraphCompileResult
            {
                Warnings = [null!, "diagram compile notice B"],
                Snapshot = new GraphSnapshot(),
            };
        }
    }

    private sealed class WhitespaceOnlyCompileWarningTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;

            if (compileCount == 1)
            {
                return new StructuredDiagramGraphCompileResult
                {
                    Warnings = ["diagram compile notice A", "   ", string.Empty],
                    Snapshot = new GraphSnapshot(),
                };
            }

            return new StructuredDiagramGraphCompileResult
            {
                Warnings = ["\t", "diagram compile notice B"],
                Snapshot = new GraphSnapshot(),
            };
        }
    }

    private sealed class CaseVariantCompileWarningTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;
            string warning = compileCount == 1 ? "Diagram compile notice" : "DIAGRAM COMPILE NOTICE";

            return new StructuredDiagramGraphCompileResult
            {
                Warnings = [warning],
                Snapshot = new GraphSnapshot(),
            };
        }
    }

    private sealed class WarningsOnlyEmptySnapshotTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;
            string warning = compileCount == 1 ? "diagram compile notice A" : "diagram compile notice B";

            return new StructuredDiagramGraphCompileResult
            {
                Warnings = [warning],
                Snapshot = new GraphSnapshot(),
            };
        }
    }

    private sealed class PaddedDuplicateCompileWarningTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;
            string warning = compileCount == 1 ? "diagram compile notice" : "  diagram compile notice  ";

            return new StructuredDiagramGraphCompileResult
            {
                Warnings = [warning],
                Snapshot = new GraphSnapshot(),
            };
        }
    }

    private sealed class PaddedCanonicalBindingDedupeTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;
            string canonicalGraphNodeId = compileCount == 1 ? "obj-sql-inv-1" : "  obj-sql-inv-1  ";

            return new StructuredDiagramGraphCompileResult
            {
                Snapshot = new GraphSnapshot(),
                CanonicalBindings =
                [
                    new StructuredDiagramCanonicalBinding
                    {
                        DiagramGraphNodeId = "diagram-node:sql",
                        DiagramSourceId = "sql",
                        CanonicalGraphNodeId = canonicalGraphNodeId,
                    },
                ],
            };
        }
    }

    private sealed class PaddedThenStrongerInferenceConfidenceTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;

            if (compileCount == 1)
            {
                string paddedConfidenceKey = $"  {StructuredDiagramGraphPropertyKeys.InferenceConfidence}  ";

                return new StructuredDiagramGraphCompileResult
                {
                    Snapshot = new GraphSnapshot
                    {
                        Nodes =
                        [
                            new GraphNode
                            {
                                NodeId = "diagram-node:api",
                                NodeType = GraphNodeTypes.TopologyResource,
                                Label = "API",
                                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                                {
                                    [paddedConfidenceKey] = "0.5",
                                    [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-conf-collapse-a",
                                },
                            },
                        ],
                    },
                };
            }

            return new StructuredDiagramGraphCompileResult
            {
                Snapshot = new GraphSnapshot
                {
                    Nodes =
                    [
                        new GraphNode
                        {
                            NodeId = "diagram-node:api",
                            NodeType = GraphNodeTypes.TopologyResource,
                            Label = "API",
                            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                            {
                                [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "1",
                                [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-conf-collapse-b",
                            },
                        },
                    ],
                },
            };
        }
    }

    private sealed class PaddedInferenceConfidencePropertyKeyTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;

            if (compileCount == 1)
            {
                string paddedConfidenceKey = $"  {StructuredDiagramGraphPropertyKeys.InferenceConfidence}  ";

                return new StructuredDiagramGraphCompileResult
                {
                    Snapshot = new GraphSnapshot
                    {
                        Nodes =
                        [
                            new GraphNode
                            {
                                NodeId = "diagram-node:api",
                                NodeType = GraphNodeTypes.TopologyResource,
                                Label = "API",
                                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                                {
                                    [paddedConfidenceKey] = "1",
                                    [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-conf-key-a",
                                },
                            },
                        ],
                    },
                };
            }

            return new StructuredDiagramGraphCompileResult
            {
                Snapshot = new GraphSnapshot
                {
                    Nodes =
                    [
                        new GraphNode
                        {
                            NodeId = "diagram-node:api",
                            NodeType = GraphNodeTypes.TopologyResource,
                            Label = "API",
                            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                            {
                                [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "0.5",
                                [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-conf-key-b",
                            },
                        },
                    ],
                },
            };
        }
    }

    private sealed class PaddedDiagramEdgePropertyKeyTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;

            GraphNode api = new()
            {
                NodeId = "diagram-node:api",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "API",
            };

            GraphNode db = new()
            {
                NodeId = "diagram-node:db",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "DB",
            };

            if (compileCount == 1)
            {
                return new StructuredDiagramGraphCompileResult
                {
                    Snapshot = new GraphSnapshot
                    {
                        Nodes = [api, db],
                        Edges =
                        [
                            new GraphEdge
                            {
                                EdgeId = "diagram-edge:first",
                                FromNodeId = "diagram-node:api",
                                ToNodeId = "diagram-node:db",
                                EdgeType = GraphEdgeTypes.ConnectsTo,
                                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                                {
                                    [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-edge-prop-a",
                                    [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "0.5",
                                },
                            },
                        ],
                    },
                };
            }

            string paddedEvidenceKey = $"  {StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId}  ";

            return new StructuredDiagramGraphCompileResult
            {
                Snapshot = new GraphSnapshot
                {
                    Nodes = [api, db],
                    Edges =
                    [
                        new GraphEdge
                        {
                            EdgeId = "diagram-edge:second",
                            FromNodeId = "diagram-node:api",
                            ToNodeId = "diagram-node:db",
                            EdgeType = GraphEdgeTypes.ConnectsTo,
                            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                            {
                                [paddedEvidenceKey] = "doc-edge-prop-b",
                                [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "1",
                            },
                        },
                    ],
                },
            };
        }
    }

    private sealed class PaddedDiagramPropertyKeyTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;

            if (compileCount == 1)
            {
                return new StructuredDiagramGraphCompileResult
                {
                    Snapshot = new GraphSnapshot
                    {
                        Nodes =
                        [
                            new GraphNode
                            {
                                NodeId = "diagram-node:api",
                                NodeType = GraphNodeTypes.TopologyResource,
                                Label = "API",
                                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                                {
                                    [StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = "doc-node-prop-a",
                                    [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "0.5",
                                },
                            },
                        ],
                    },
                };
            }

            string paddedEvidenceKey = $"  {StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId}  ";

            return new StructuredDiagramGraphCompileResult
            {
                Snapshot = new GraphSnapshot
                {
                    Nodes =
                    [
                        new GraphNode
                        {
                            NodeId = "diagram-node:api",
                            NodeType = GraphNodeTypes.TopologyResource,
                            Label = "API",
                            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                            {
                                [paddedEvidenceKey] = "doc-node-prop-b",
                                [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "1",
                            },
                        },
                    ],
                },
            };
        }
    }

    private sealed class PaddedDuplicateNodeIdTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;
            string nodeId = compileCount == 1 ? "diagram-node:api" : "  diagram-node:api  ";
            string label = compileCount == 1 ? "First" : "Second";

            return new StructuredDiagramGraphCompileResult
            {
                Snapshot = new GraphSnapshot
                {
                    Nodes =
                    [
                        new GraphNode
                        {
                            NodeId = nodeId,
                            NodeType = GraphNodeTypes.TopologyResource,
                            Label = label,
                        },
                    ],
                },
            };
        }
    }

    private sealed class PaddedDuplicateEdgeKeyTestCompiler : IArchitectureDiagramToGraphCompiler
    {
        private int compileCount;

        public StructuredDiagramGraphCompileResult Compile(
            ArchitectureDiagramModelRecord model,
            StructuredDiagramGraphCompileOptions options)
        {
            compileCount++;

            GraphEdge edge = compileCount == 1
                ? new GraphEdge
                {
                    EdgeId = "diagram-edge:first",
                    FromNodeId = "diagram-node:api",
                    ToNodeId = "diagram-node:db",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                }
                : new GraphEdge
                {
                    EdgeId = "diagram-edge:padded-second",
                    FromNodeId = "  diagram-node:api  ",
                    ToNodeId = "  diagram-node:db  ",
                    EdgeType = $"  {GraphEdgeTypes.ConnectsTo}  ",
                };

            return new StructuredDiagramGraphCompileResult
            {
                Snapshot = new GraphSnapshot
                {
                    Nodes =
                    [
                        new GraphNode
                        {
                            NodeId = "diagram-node:api",
                            NodeType = GraphNodeTypes.TopologyResource,
                            Label = "API",
                        },
                        new GraphNode
                        {
                            NodeId = "diagram-node:db",
                            NodeType = GraphNodeTypes.TopologyResource,
                            Label = "DB",
                        },
                    ],
                    Edges = [edge],
                },
            };
        }
    }
}
