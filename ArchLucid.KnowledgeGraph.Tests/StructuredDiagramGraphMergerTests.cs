using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
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
}
