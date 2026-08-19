using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Cli")]
public sealed class GraphWireMermaidFormatterTests
{
    [Fact]
    public void ToFlowchart_empty_model_emits_flowchart_header_only()
    {
        GraphWireModel vm = new();

        string mermaid = GraphWireMermaidFormatter.ToFlowchart(vm);

        mermaid.Should().Be("flowchart LR");
    }

    [Fact]
    public void ToFlowchart_includes_stub_nodes_for_edge_endpoints()
    {
        GraphWireModel vm = new()
        {
            Nodes = [new GraphNodeWire { Id = "a", Label = "Node A", Type = "kind" }],

            Edges =
                [new GraphEdgeWire { Source = "a", Target = "b", Type = "rel" }],
        };

        string mermaid = GraphWireMermaidFormatter.ToFlowchart(vm);

        mermaid.Should().StartWith("flowchart LR");
        mermaid.Should().Contain("Node A :: kind");
        mermaid.Should().Contain("-- \"rel\" -->");
        mermaid.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries).Length.Should().BeGreaterThan(2);
    }

    [Fact]
    public void ToFlowchart_escapes_quotes_in_labels()
    {
        GraphWireModel vm = new()
        {
            Nodes = [new GraphNodeWire { Id = "n1", Label = "a\"b\\c", Type = "" }],
        };

        string mermaid = GraphWireMermaidFormatter.ToFlowchart(vm);

        mermaid.Should().Contain("a'b\\\\c");
    }

    [Fact]
    public void ToFlowchart_uses_unknown_label_for_missing_node_metadata()
    {
        GraphWireModel vm = new()
        {
            Edges = [new GraphEdgeWire { Source = "only-edge", Target = "other", Type = "" }],
        };

        string mermaid = GraphWireMermaidFormatter.ToFlowchart(vm);

        mermaid.Should().Contain("\"?\"");
    }
}
