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
