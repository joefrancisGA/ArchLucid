using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredDiagramCanonicalBinderTests
{
    private const string ArmSqlServerId =
        "/subscriptions/11111111-2222-3333-4444-555555555555/resourceGroups/pay/providers/Microsoft.Sql/servers/pay-sql";

    [Fact]
    public void BindToCanonicalNodes_terraform_address_in_label_reuses_existing_graph_node()
    {
        GraphNode declarationNode = CreateTopologyNode(
            "obj-pay-sql",
            "pay_sql",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_mssql_server",
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
            {
                Nodes =
                [
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "sql",
                        Label = "azurerm_mssql_server.pay_sql",
                        Kind = ArchitectureDiagramNodeKinds.System,
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                ],
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [declarationNode]);

        bound.Snapshot.Nodes.Should().BeEmpty();
        bound.CanonicalBindings.Should().ContainSingle()
            .Which.CanonicalGraphNodeId.Should().Be("obj-pay-sql");
    }

    [Fact]
    public void BindToCanonicalNodes_arm_id_in_label_reuses_existing_graph_node()
    {
        GraphNode inventoryNode = CreateTopologyNode(
            "obj-sql-1",
            "pay-sql",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["azureResourceId"] = ArmSqlServerId,
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
            {
                Nodes =
                [
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "sql",
                        Label = ArmSqlServerId,
                        Kind = ArchitectureDiagramNodeKinds.System,
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                ],
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [inventoryNode]);

        bound.Snapshot.Nodes.Should().BeEmpty();
        bound.CanonicalBindings.Should().ContainSingle()
            .Which.CanonicalGraphNodeId.Should().Be("obj-sql-1");
    }

    [Fact]
    public void BindToCanonicalNodes_ambiguous_display_name_does_not_bind()
    {
        GraphNode first = CreateTopologyNode("obj-sql-1", "SQL Database", []);
        GraphNode second = CreateTopologyNode("obj-sql-2", "SQL Database", []);

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
            {
                Nodes =
                [
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "sql",
                        Label = "SQL Database",
                        Kind = ArchitectureDiagramNodeKinds.System,
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                ],
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [first, second]);

        bound.Snapshot.Nodes.Should().ContainSingle(node => node.NodeId == "diagram-node:sql");
        bound.CanonicalBindings.Should().BeEmpty();
    }

    [Fact]
    public void BindToCanonicalNodes_unique_display_name_binds_and_stamps_observed_fact()
    {
        GraphNode inventoryNode = CreateTopologyNode("obj-api-1", "API Gateway", []);

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [inventoryNode]);

        bound.Snapshot.Nodes.Should().BeEmpty();
        bound.CanonicalBindings.Should().ContainSingle();

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [inventoryNode],
            bound.CanonicalBindings);

        inventoryNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
        inventoryNode.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId].Should().Be("api");
    }

    [Fact]
    public void BindToCanonicalNodes_copies_source_evidence_item_id_onto_bound_canonical_node()
    {
        const string EvidenceItemId = "doc-tf-bind-evidence";

        GraphNode declarationNode = CreateTopologyNode(
            "obj-pay-sql",
            "pay_sql",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_mssql_server",
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
            {
                Nodes =
                [
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "sql",
                        Label = "azurerm_mssql_server.pay_sql",
                        Kind = ArchitectureDiagramNodeKinds.System,
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                ],
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
                SourceEvidenceItemId = EvidenceItemId,
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [declarationNode]);

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [declarationNode],
            bound.CanonicalBindings);

        declarationNode.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId].Should().Be("sql");
        declarationNode.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId]
            .Should().Be(EvidenceItemId);
    }

    [Fact]
    public void BindToCanonicalNodes_reads_source_evidence_id_when_persisted_property_key_uses_different_casing()
    {
        const string EvidenceItemId = "doc-casing-bind-evidence";
        GraphNode declarationNode = CreateTopologyNode("obj-pay-sql", "pay_sql", []);
        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
            {
                Nodes =
                [
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "sql",
                        Label = "pay_sql",
                        Kind = ArchitectureDiagramNodeKinds.System,
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                ],
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
                SourceEvidenceItemId = EvidenceItemId,
            },
            CreateCompileOptions());
        GraphNode diagramNode = compileResult.Snapshot.Nodes.Single();
        diagramNode.Properties.Remove(StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId);
        diagramNode.Properties["STRUCTUREDDIAGRAM.SOURCEEVIDENCEITEMID"] = EvidenceItemId;

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [declarationNode]);

        bound.CanonicalBindings.Should().ContainSingle()
            .Which.SourceEvidenceItemId.Should().Be(EvidenceItemId);
    }

    [Fact]
    public void BindToCanonicalNodes_remaps_edges_when_both_canonical_targets_have_surrounding_whitespace_on_node_id()
    {
        GraphNode apiNode = CreateTopologyNode("  obj-api-1  ", "API Gateway", []);
        GraphNode sqlNode = CreateTopologyNode(
            "  obj-sql-1  ",
            "pay-sql",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["azureResourceId"] = ArmSqlServerId,
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
                        Label = ArmSqlServerId,
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
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [apiNode, sqlNode]);

        bound.Snapshot.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == "obj-api-1"
            && edge.ToNodeId == "obj-sql-1");
    }

    [Fact]
    public void BindToCanonicalNodes_trims_padded_canonical_node_id_when_remapping_edges()
    {
        GraphNode apiNode = CreateTopologyNode("obj-api-1", "API Gateway", []);
        GraphNode sqlNode = CreateTopologyNode(
            "  obj-sql-1  ",
            "pay-sql",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["azureResourceId"] = ArmSqlServerId,
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
                        Label = ArmSqlServerId,
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
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [apiNode, sqlNode]);

        bound.CanonicalBindings.Should().Contain(binding =>
            binding.CanonicalGraphNodeId == "obj-sql-1"
            && binding.DiagramSourceId == "sql");
        bound.Snapshot.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == "obj-api-1"
            && edge.ToNodeId == "obj-sql-1");

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [sqlNode],
            bound.CanonicalBindings);

        sqlNode.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId].Should().Be("sql");
    }

    [Fact]
    public void BindToCanonicalNodes_remaps_edges_to_bound_canonical_nodes()
    {
        GraphNode apiNode = CreateTopologyNode("obj-api-1", "API Gateway", []);
        GraphNode sqlNode = CreateTopologyNode(
            "obj-sql-1",
            "pay-sql",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["azureResourceId"] = ArmSqlServerId,
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
                        Label = ArmSqlServerId,
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
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [apiNode, sqlNode]);

        bound.Snapshot.Nodes.Should().BeEmpty();
        bound.Snapshot.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == "obj-api-1"
            && edge.ToNodeId == "obj-sql-1"
            && edge.InferenceSource == GraphEdgeInferenceSources.StructuredParse);
    }

    [Fact]
    public void BindToCanonicalNodes_deduplicates_parallel_edges_after_endpoint_remap()
    {
        GraphNode apiNode = CreateTopologyNode("obj-api-1", "API Gateway", []);
        GraphNode sqlNode = CreateTopologyNode(
            "obj-sql-1",
            "pay-sql",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["azureResourceId"] = ArmSqlServerId,
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
                        Id = "sql-a",
                        Label = ArmSqlServerId,
                        Kind = ArchitectureDiagramNodeKinds.System,
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "sql-b",
                        Label = ArmSqlServerId,
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
                        TargetId = "sql-a",
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                    new ArchitectureDiagramEdgeRecord
                    {
                        Id = "e2",
                        SourceId = "api",
                        TargetId = "sql-b",
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    },
                ],
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [apiNode, sqlNode]);

        bound.Snapshot.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == "obj-api-1"
            && edge.ToNodeId == "obj-sql-1"
            && edge.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void ApplyBindingsToGraphNodes_collapses_padded_inference_confidence_alias_when_stamping_bind_metadata()
    {
        string paddedConfidenceKey = $"  {StructuredDiagramGraphPropertyKeys.InferenceConfidence}  ";
        GraphNode inventoryNode = CreateTopologyNode(
            "obj-api-1",
            "API Gateway",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [paddedConfidenceKey] = "0.5",
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [inventoryNode]);

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [inventoryNode],
            bound.CanonicalBindings);

        inventoryNode.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.InferenceConfidence,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);

        GraphNodePropertyReader.TryGetPropertyValue(
                inventoryNode.Properties,
                StructuredDiagramGraphPropertyKeys.InferenceConfidence,
                out string? confidence)
            .Should()
            .BeTrue();
        confidence.Should().Be("1");
        inventoryNode.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence].Should().Be("1");
    }

    [Fact]
    public void ApplyBindingsToGraphNodes_collapses_padded_provenance_kind_alias_when_stamping_bind_metadata()
    {
        string paddedProvenanceKey = $"  {StructuredDiagramGraphPropertyKeys.ProvenanceKind}  ";
        GraphNode inventoryNode = CreateTopologyNode(
            "obj-api-1",
            "API Gateway",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [paddedProvenanceKey] = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [inventoryNode]);

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [inventoryNode],
            bound.CanonicalBindings);

        inventoryNode.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.ProvenanceKind,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);

        GraphNodePropertyReader.TryGetPropertyValue(
                inventoryNode.Properties,
                StructuredDiagramGraphPropertyKeys.ProvenanceKind,
                out string? provenanceKind)
            .Should()
            .BeTrue();
        provenanceKind.Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
        inventoryNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should()
            .Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void ApplyBindingsToGraphNodes_collapses_padded_bound_diagram_id_aliases_when_stamping_bind_metadata()
    {
        string paddedBoundSourceKey = $"  {StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId}  ";
        string paddedBoundGraphKey = $"  {StructuredDiagramGraphPropertyKeys.BoundDiagramGraphNodeId}  ";
        GraphNode inventoryNode = CreateTopologyNode(
            "obj-api-1",
            "API Gateway",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [paddedBoundSourceKey] = "stale-diagram-source",
                [paddedBoundGraphKey] = "stale-diagram-graph-node",
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [inventoryNode]);

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [inventoryNode],
            bound.CanonicalBindings);

        inventoryNode.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);
        inventoryNode.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.BoundDiagramGraphNodeId,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);

        GraphNodePropertyReader.TryGetPropertyValue(
                inventoryNode.Properties,
                StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId,
                out string? boundSourceId)
            .Should()
            .BeTrue();
        boundSourceId.Should().Be("api");

        GraphNodePropertyReader.TryGetPropertyValue(
                inventoryNode.Properties,
                StructuredDiagramGraphPropertyKeys.BoundDiagramGraphNodeId,
                out string? boundGraphNodeId)
            .Should()
            .BeTrue();
        boundGraphNodeId.Should().Be("diagram-node:api");

        inventoryNode.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId].Should().Be("api");
        inventoryNode.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramGraphNodeId]
            .Should()
            .Be("diagram-node:api");
    }

    [Fact]
    public void ApplyBindingsToGraphNodes_collapses_padded_source_evidence_alias_when_stamping_bind_metadata()
    {
        const string EvidenceItemId = "doc-bind-evidence-fresh";
        string paddedEvidenceKey = $"  {StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId}  ";
        GraphNode inventoryNode = CreateTopologyNode(
            "obj-api-1",
            "API Gateway",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [paddedEvidenceKey] = "stale-doc-evidence",
            });

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            new ArchitectureDiagramModelRecord
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
                SourceEvidenceItemId = EvidenceItemId,
            },
            CreateCompileOptions());

        StructuredDiagramGraphCompileResult bound = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(
            compileResult,
            [inventoryNode]);

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(
            [inventoryNode],
            bound.CanonicalBindings);

        inventoryNode.Properties.Keys
            .Count(key => string.Equals(
                key.Trim(),
                StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId,
                StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(1);

        GraphNodePropertyReader.TryGetPropertyValue(
                inventoryNode.Properties,
                StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId,
                out string? evidenceItemId)
            .Should()
            .BeTrue();
        evidenceItemId.Should().Be(EvidenceItemId);
        inventoryNode.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId]
            .Should()
            .Be(EvidenceItemId);
    }

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string label,
        Dictionary<string, string> properties)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "InfrastructureDeclaration",
            SourceId = nodeId,
            Properties = properties,
        };
    }

    private static StructuredDiagramGraphCompileOptions CreateCompileOptions()
    {
        return new StructuredDiagramGraphCompileOptions
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            GraphSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            CreatedUtc = DateTime.Parse("2026-01-01T00:00:00Z"),
        };
    }
}
