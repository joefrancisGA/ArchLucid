using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DiagramDeclarationOmissionAnalyzerTests
{
    [Fact]
    public void Analyze_emits_omission_when_cited_declaration_is_not_in_diagram_connector_set()
    {
        IReadOnlyList<DiagramDeclarationOmission> omissions =
            DiagramDeclarationOmissionAnalyzer.Analyze(
                GoldenCorpusDiagramDeclarationOmissionGraphFactory.CreateDiagramDeclarationOmissionGraph());

        DiagramDeclarationOmission omission = omissions.Should().ContainSingle().Subject;
        omission.DiagramParticipantNodeId.Should().Be("diagram-node:api");
        omission.OmittedDeclarationNodeId.Should().Be("obj-payments-kv");
        omission.ReferenceKind.Should().Be(DanglingDeclarationReferenceKind.KeyVaultUri);
    }

    [Fact]
    public void Analyze_returns_empty_when_diagram_does_not_assert_completeness()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "diagram-node:api",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Orders API",
                    SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
                    SourceId = "api",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["appSettings"] =
                            "KeyVaultUri=https://payments-kv.vault.azure.net/secrets/db-connection",
                    },
                },
                new GraphNode
                {
                    NodeId = "obj-payments-kv",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payments-kv",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["name"] = "payments-kv",
                    },
                },
            ],
            Edges = [],
        };

        DiagramDeclarationOmissionAnalyzer.Analyze(graph).Should().BeEmpty();
    }

    [Fact]
    public void Analyze_returns_empty_when_cited_declaration_is_already_a_diagram_participant()
    {
        GraphSnapshot graph = GoldenCorpusDiagramDeclarationOmissionGraphFactory.CreateDiagramDeclarationOmissionGraph();
        graph.Nodes.RemoveAll(node => node.NodeId == "obj-payments-kv");
        graph.Nodes.Add(
            new GraphNode
            {
                NodeId = "diagram-node:kv",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "payments-kv",
                SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
                SourceId = "kv",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["name"] = "payments-kv",
                },
            });

        DiagramDeclarationOmissionAnalyzer.Analyze(graph).Should().BeEmpty();
    }
}
