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
}
