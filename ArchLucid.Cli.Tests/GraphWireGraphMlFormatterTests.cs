using System.Xml;
using ArchLucid.Cli.Commands;
using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Cli")]
public sealed class GraphWireGraphMlFormatterTests
{
    private static XmlNamespaceManager CreateNs(XmlDocument doc)
    {
        XmlNamespaceManager ns = new(doc.NameTable);

        ns.AddNamespace("g", GraphWireGraphMlFormatter.GraphMlNamespaceUri);

        return ns;
    }

    [Fact]
    public void ToGraphMl_empty_model_emits_directed_graph_container()
    {
        GraphWireModel vm = new();

        string xml = GraphWireGraphMlFormatter.ToGraphMl(vm);

        xml.Should().Contain("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
        xml.Should().Contain("edgedefault=\"directed\"");
        xml.Should().Contain("id=\"archlucid-provenance\"");

        XmlDocument doc = new();

        doc.LoadXml(xml);

        XmlNamespaceManager ns = CreateNs(doc);

        XmlNodeList? nodes = doc.SelectNodes("//g:node", ns);

        nodes.Should().NotBeNull();

        nodes!.Count.Should().Be(0);

        XmlNodeList? edges = doc.SelectNodes("//g:edge", ns);

        edges.Should().NotBeNull();

        edges!.Count.Should().Be(0);
    }

    [Fact]
    public void ToGraphMl_includes_stub_nodes_for_edge_endpoints()
    {
        GraphWireModel vm = new()
        {
            Nodes = [new GraphNodeWire { Id = "a", Label = "Node A", Type = "kind"}],

            Edges =
                [new GraphEdgeWire { Source = "a", Target = "b", Type = "rel"}],
        };

        string xml = GraphWireGraphMlFormatter.ToGraphMl(vm);

        XmlDocument doc = new();

        doc.LoadXml(xml);

        XmlNamespaceManager ns = CreateNs(doc);

        XmlNodeList? nodeList = doc.SelectNodes("//g:node", ns);

        nodeList.Should().NotBeNull();

        nodeList!.Count.Should().Be(2);

        XmlNodeList? edgeList = doc.SelectNodes("//g:edge", ns);

        edgeList.Should().NotBeNull();

        edgeList!.Count.Should().Be(1);

        XmlNode? edge = doc.SelectSingleNode("//g:edge", ns);

        edge.Should().NotBeNull();

        edge!.Attributes!["source"].Should().NotBeNull();

        edge.Attributes["target"].Should().NotBeNull();
    }

    [Fact]
    public void ToGraphMl_escapes_markup_in_node_caption()
    {
        GraphWireModel vm = new()
        {
            Nodes = [new GraphNodeWire { Id = "n1", Label = "a<b>&\"c", Type = ""}],
        };

        string xml = GraphWireGraphMlFormatter.ToGraphMl(vm);

        XmlDocument doc = new();

        doc.LoadXml(xml);

        XmlNamespaceManager ns = CreateNs(doc);

        XmlNode? labelData = doc.SelectSingleNode("//g:node/g:data[@key='n-label']", ns);

        labelData.Should().NotBeNull();

        labelData!.InnerText.Should().Be("a<b>&\"c");
    }

    [Fact]
    public void ToGraphMl_writes_relation_on_edges_when_present()
    {
        GraphWireModel vm = new()
        {
            Nodes =
            [
                new GraphNodeWire { Id = "x", Label = "X", Type = ""},
                new GraphNodeWire { Id = "y", Label = "Y", Type = ""},
            ],

            Edges = [new GraphEdgeWire { Source = "x", Target = "y", Type = "derived"}],
        };

        string xml = GraphWireGraphMlFormatter.ToGraphMl(vm);

        XmlDocument doc = new();

        doc.LoadXml(xml);

        XmlNamespaceManager ns = CreateNs(doc);

        XmlNode? rel = doc.SelectSingleNode("//g:edge/g:data[@key='e-type']", ns);

        rel.Should().NotBeNull();

        rel!.InnerText.Should().Be("derived");
    }
}
