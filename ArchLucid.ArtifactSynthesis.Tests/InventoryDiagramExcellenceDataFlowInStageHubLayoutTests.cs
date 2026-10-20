using System.Globalization;
using System.Text.RegularExpressions;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Testing;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>IDX-07b — hub-spoke inside a Data Flow stage column.</summary>
[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceDataFlowInStageHubLayoutTests
{
    private static readonly Regex TranslateRegex = new(
        @"translate\(([-\d.]+),([-\d.]+)\)",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void DataFlowInStageHub_one_stage_adf_with_four_sinks_stamps_hub_right_of_spokes()
    {
        DiagramAst ast = BuildAdfFourSinkStageAst();
        XDocument svg = Render(ast);

        CountHubMarkers(svg).Should().Be(1);
        InventoryDiagramExcellenceRatchetAssertions.AssertRoleColumnMarkersAbsent(
            svg.ToString(),
            DiagramMode.DataFlow);
        ast.Subgraphs.Should().ContainSingle(subgraph => subgraph.SubgraphId == "stage-ingest");

        double hubX = NodeCenterX(svg, "adf");
        IReadOnlyList<string> spokeIds = ["sink_sql", "sink_storage", "sink_eventhub"];
        double? sharedSpokeX = null;

        foreach (string spokeId in spokeIds)
        {
            double spokeX = NodeCenterX(svg, spokeId);
            hubX.Should().BeGreaterThan(spokeX);
            sharedSpokeX = sharedSpokeX is null ? spokeX : sharedSpokeX;
            spokeX.Should().BeApproximately(sharedSpokeX.Value, 1.0d);
        }
    }

    [Fact]
    public void DataFlowInStageHub_four_same_storage_accounts_stay_separate_spokes()
    {
        DiagramAst ast = BuildAdfFourSameStorageStageAst();
        XDocument svg = Render(ast);

        CountHubMarkers(svg).Should().Be(1);
        InventoryDiagramExcellenceRatchetAssertions.AssertRoleColumnMarkersAbsent(
            svg.ToString(),
            DiagramMode.DataFlow);

        IReadOnlyList<string> spokeIds = ["st0", "st1", "st2", "st3"];
        double hubX = NodeCenterX(svg, "adf");
        double? sharedSpokeX = null;

        foreach (string spokeId in spokeIds)
        {
            svg.Descendants()
                .Any(element => element.Attribute("id")?.Value == $"node-{spokeId}")
                .Should()
                .BeTrue(spokeId);
            double spokeX = NodeCenterX(svg, spokeId);
            hubX.Should().BeGreaterThan(spokeX);
            sharedSpokeX = sharedSpokeX is null ? spokeX : sharedSpokeX;
            spokeX.Should().BeApproximately(sharedSpokeX.Value, 1.0d);
        }
    }

    [Fact]
    public void DataFlowInStageHub_twelve_spokes_in_one_stage_stays_single_hub_subcolumn()
    {
        DiagramAst ast = BuildAdfTwelveStorageStageAst();
        XDocument svg = Render(ast);

        CountHubMarkers(svg).Should().Be(1);
        svg.Descendants()
            .Any(element => element.Attribute("data-hub-spoke")?.Value == "hub" && element.Attribute("id")?.Value == "node-adf")
            .Should()
            .BeTrue();

        IReadOnlyList<string> spokeIds = Enumerable.Range(0, 12).Select(index => $"st{index}").ToList();

        foreach (string spokeId in spokeIds)
        {
            svg.Descendants()
                .Any(element => element.Attribute("id")?.Value == $"node-{spokeId}")
                .Should()
                .BeTrue(spokeId);
        }
    }

    [Fact]
    public void DataFlowInStageHub_chain_with_max_degree_two_has_no_hub_marker()
    {
        DiagramAst ast = BuildChainStageAst();
        XDocument svg = Render(ast);

        CountHubMarkers(svg).Should().Be(0);
    }

    [Fact]
    public void DataFlowInStageHub_two_stages_hub_only_in_second_stage()
    {
        DiagramAst ast = BuildTwoStageHubInSecondAst();
        XDocument svg = Render(ast);

        CountHubMarkers(svg).Should().Be(1);
        double stageOneX = NodeCenterX(svg, "landing");
        double stageTwoSpokeX = NodeCenterX(svg, "st0");

        stageOneX.Should().BeLessThan(stageTwoSpokeX);
        CrossStageEdgePathMustAvoidSpokeCards(ast, svg, "landing", "adf", ["st0", "st1", "st2", "st3"]);
    }

    private static DiagramAst BuildAdfTwelveStorageStageAst()
    {
        const string stageId = "stage-ingest";

        List<DiagramNode> nodes =
        [
            Node("adf", "factory", "Microsoft.DataFactory/factories", stageId, orderKey: 0),
            ..Enumerable.Range(0, 12).Select(index =>
                Node($"st{index}", $"lake-{index}", "Microsoft.Storage/storageAccounts", stageId, orderKey: index + 1)),
        ];
        List<DiagramEdge> edges = Enumerable.Range(0, 12)
            .Select(index => Edge("adf", $"st{index}"))
            .ToList();

        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = stageId, Label = "Ingest", OrderKey = 0 },
            ],
            Nodes = nodes,
            Edges = edges,
        };
    }

    private static DiagramAst BuildAdfFourSameStorageStageAst()
    {
        const string stageId = "stage-ingest";

        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = stageId, Label = "Ingest", OrderKey = 0 },
            ],
            Nodes =
            [
                Node("adf", "factory", "Microsoft.DataFactory/factories", stageId, orderKey: 0),
                Node("st0", "lake-0", "Microsoft.Storage/storageAccounts", stageId, orderKey: 1),
                Node("st1", "lake-1", "Microsoft.Storage/storageAccounts", stageId, orderKey: 2),
                Node("st2", "lake-2", "Microsoft.Storage/storageAccounts", stageId, orderKey: 3),
                Node("st3", "lake-3", "Microsoft.Storage/storageAccounts", stageId, orderKey: 4),
            ],
            Edges =
            [
                Edge("adf", "st0"),
                Edge("adf", "st1"),
                Edge("adf", "st2"),
                Edge("adf", "st3"),
            ],
        };
    }

    private static DiagramAst BuildAdfFourSinkStageAst()
    {
        const string stageId = "stage-ingest";

        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = stageId, Label = "Ingest", OrderKey = 0 },
            ],
            Nodes =
            [
                Node("adf", "factory", "Microsoft.DataFactory/factories", stageId, orderKey: 0),
                Node("sink_sql", "sql-db", "Microsoft.Sql/servers/databases", stageId, orderKey: 1),
                Node("sink_storage", "lake", "Microsoft.Storage/storageAccounts", stageId, orderKey: 2),
                Node("sink_eventhub", "events", "Microsoft.EventHub/namespaces", stageId, orderKey: 3),
            ],
            Edges =
            [
                Edge("adf", "sink_sql"),
                Edge("adf", "sink_storage"),
                Edge("adf", "sink_eventhub"),
            ],
        };
    }

    private static DiagramAst BuildChainStageAst()
    {
        const string stageId = "stage-chain";

        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = stageId, Label = "Chain", OrderKey = 0 },
            ],
            Nodes =
            [
                Node("n0", "n0", "Microsoft.Storage/storageAccounts", stageId, 0),
                Node("n1", "n1", "Microsoft.Storage/storageAccounts", stageId, 1),
                Node("n2", "n2", "Microsoft.Storage/storageAccounts", stageId, 2),
                Node("n3", "n3", "Microsoft.Storage/storageAccounts", stageId, 3),
            ],
            Edges =
            [
                Edge("n0", "n1"),
                Edge("n1", "n2"),
                Edge("n2", "n3"),
            ],
        };
    }

    private static DiagramAst BuildTwoStageHubInSecondAst()
    {
        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "stage-1", Label = "Source", OrderKey = 0 },
                new DiagramSubgraph { SubgraphId = "stage-2", Label = "Transform", OrderKey = 1 },
            ],
            Nodes =
            [
                Node("landing", "landing", "Microsoft.Storage/storageAccounts", "stage-1", 0),
                Node("adf", "factory", "Microsoft.DataFactory/factories", "stage-2", 0),
                Node("st0", "lake-0", "Microsoft.Storage/storageAccounts", "stage-2", 1),
                Node("st1", "lake-1", "Microsoft.Storage/storageAccounts", "stage-2", 2),
                Node("st2", "lake-2", "Microsoft.Storage/storageAccounts", "stage-2", 3),
                Node("st3", "lake-3", "Microsoft.Storage/storageAccounts", "stage-2", 4),
            ],
            Edges =
            [
                Edge("landing", "adf"),
                Edge("adf", "st0"),
                Edge("adf", "st1"),
                Edge("adf", "st2"),
                Edge("adf", "st3"),
            ],
        };
    }

    private XDocument Render(DiagramAst ast)
    {
        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue(result.Error);
        return XDocument.Parse(result.Svg!);
    }

    private static int CountHubMarkers(XDocument svg)
    {
        return svg.Descendants()
            .Count(element => element.Attribute("data-hub-spoke")?.Value == "hub");
    }

    private static double NodeCenterX(XDocument svg, string nodeId)
    {
        XElement? node = svg.Descendants()
            .FirstOrDefault(element =>
                element.Attribute("id")?.Value == $"node-{nodeId}");
        node.Should().NotBeNull(nodeId);

        string? transform = node!.Attribute("transform")?.Value;
        transform.Should().NotBeNull();
        Match match = TranslateRegex.Match(transform!);
        match.Success.Should().BeTrue();
        double x = double.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
        double width = double.Parse(
            node.Descendants().First(element => element.Attribute("class")?.Value == "node-card").Attribute("width")!.Value,
            CultureInfo.InvariantCulture);

        return x + (width / 2.0d);
    }

    private static DiagramNode Node(string nodeId, string label, string armType, string subgraphId, int orderKey)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            NodeType = "TopologyResource",
            ArmResourceType = armType,
            ArmResourceGroup = "rg-data",
            SubgraphId = subgraphId,
            OrderKey = orderKey,
        };
    }

    private static DiagramEdge Edge(string fromNodeId, string toNodeId)
    {
        return new DiagramEdge { FromNodeId = fromNodeId, ToNodeId = toNodeId, Label = "writes" };
    }

    private static void CrossStageEdgePathMustAvoidSpokeCards(
        DiagramAst ast,
        XDocument svg,
        string fromNodeId,
        string toNodeId,
        IReadOnlyList<string> spokeNodeIds)
    {
        InventoryDiagramExcellenceDataFlowHubRoutingAssertions.AssertCrossStageRouteAvoidsSpokeCards(
            ast,
            svg,
            fromNodeId,
            toNodeId,
            spokeNodeIds);
    }
}
