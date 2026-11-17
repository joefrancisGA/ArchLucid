using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Shared IDX-13 contract assertions parameterized by <see cref="DiagramMode"/>.</summary>
public static class InventoryDiagramExcellenceRatchetAssertions
{
    public static void AssertPeeringEdgesUsePeeringVerb(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges.Where(DiagramForestEdgeLabelCollapse.IsPeeringEdge))
        {
            string label = edge.Label ?? string.Empty;
            label.Contains("peering", StringComparison.OrdinalIgnoreCase)
                .Should()
                .BeTrue("honest verb catalog");
            label.Should().NotBe("connects");
        }
    }

    public static void AssertLogicAppConnectionEdgesAreNotAClique(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        DiagramNode? workflow = ast.Nodes.FirstOrDefault(node =>
            (node.ArmResourceType ?? string.Empty).Contains("Logic/workflows", StringComparison.OrdinalIgnoreCase)
            || (node.ArmResourceType ?? string.Empty).Contains("Web/sites", StringComparison.OrdinalIgnoreCase));

        if (workflow is null)
        {
            return;
        }

        int connectionTargets = ast.Edges.Count(edge =>
            string.Equals(edge.FromNodeId, workflow.NodeId, StringComparison.Ordinal)
            && ast.Nodes.Any(node =>
                string.Equals(node.NodeId, edge.ToNodeId, StringComparison.Ordinal)
                && (node.ArmResourceType ?? string.Empty).Contains("connections", StringComparison.OrdinalIgnoreCase)));

        if (connectionTargets > 1)
        {
            int connectionNodes = ast.Nodes.Count(node =>
                (node.ArmResourceType ?? string.Empty).Contains("connections", StringComparison.OrdinalIgnoreCase));
            connectionNodes.Should().BeLessThanOrEqualTo(1, "rollup should collapse duplicate Office 365 connectors");
        }
    }

    public static void AssertDataFlowRetainsStageSubgraphs(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (!ast.Title.Contains("(DataFlow)", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        ast.Subgraphs.Should().NotBeEmpty("DataFlow must keep stage subgraphs instead of RG-first packing");
    }

    public static void AssertDataArchitectureRetainsTypeGroupSubgraphs(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (!ast.Title.Contains("(DataArchitecture)", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        ast.Subgraphs.Should().NotBeEmpty("DataArchitecture must keep repository type-group subgraphs");
    }

    public static void AssertSubscriptionFramePolicy(string svg, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(svg);

        bool subscriptionScoped = mode is DiagramMode.FullSubscription
            or DiagramMode.Executive
            or DiagramMode.Network
            or DiagramMode.Architecture
            or DiagramMode.Security
            or DiagramMode.Identity
            or DiagramMode.Data
            or DiagramMode.DataFlow
            or DiagramMode.DataArchitecture;

        if (mode is DiagramMode.ResourceGroup
            or DiagramMode.SelectedResources
            or DiagramMode.DependencyNeighborhood)
        {
            svg.Should().NotContain("class=\"sub-frame", mode.ToString());
            return;
        }

        if (subscriptionScoped)
        {
            svg.Should().Contain("sub-frame", mode.ToString());
        }
    }

    public static void AssertVnetFramePolicy(string svg, DiagramMode mode, bool expectVnetMembersInAst)
    {
        ArgumentNullException.ThrowIfNull(svg);

        int vnetFrames = XDocument.Parse(svg)
            .Descendants()
            .Count(element => element.Attribute("class")?.Value == "vnet-frame");

        if (mode == DiagramMode.Identity || !expectVnetMembersInAst)
        {
            vnetFrames.Should().Be(0, mode.ToString());
            return;
        }

        if (mode == DiagramMode.Network)
        {
            vnetFrames.Should().BeGreaterThan(0, mode.ToString());
        }
    }

    public static void AssertDotContainsResourceGroupCluster(string dot)
    {
        ArgumentNullException.ThrowIfNull(dot);
        dot.Should().Contain("subgraph cluster_rg_", "PNG/DOT should mirror RG frames from forest layout");
    }

    public static void AssertDotResourceGroupClusterPolicy(string dot, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(dot);

        if (mode == DiagramMode.DataFlow)
        {
            dot.Should().Contain("subgraph cluster_", "Data Flow DOT should emit stage swimlane clusters");
            dot.Should().NotContain("subgraph cluster_rg_", "Data Flow DOT should not replace stages with RG frames");
            return;
        }

        AssertDotContainsResourceGroupCluster(dot);
    }

    public static void AssertDotSubscriptionClusterPolicy(string dot, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(dot);

        bool subscriptionScoped = mode is DiagramMode.FullSubscription
            or DiagramMode.Executive
            or DiagramMode.Network
            or DiagramMode.Architecture
            or DiagramMode.Security
            or DiagramMode.Identity
            or DiagramMode.Data
            or DiagramMode.DataArchitecture;

        if (mode is DiagramMode.ResourceGroup
            or DiagramMode.SelectedResources
            or DiagramMode.DependencyNeighborhood
            or DiagramMode.DataFlow)
        {
            dot.Should().NotContain("subgraph cluster_subscription", mode.ToString());
            return;
        }

        if (subscriptionScoped)
        {
            dot.Should().Contain("subgraph cluster_subscription", mode.ToString());
        }
    }

    public static void AssertSubnetFramePolicy(string svg, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(svg);

        if (mode != DiagramMode.Network)
        {
            return;
        }

        int subnetFrames = XDocument.Parse(svg)
            .Descendants()
            .Count(element => element.Attribute("class")?.Value == "subnet-frame");

        subnetFrames.Should().BeGreaterThan(0, "Network mode should draw subnet frames when subnet nodes and cited members exist");
    }

    public static void AssertForestAndDotNestedFrameParity(string svg, string dot)
    {
        ArgumentNullException.ThrowIfNull(svg);
        ArgumentNullException.ThrowIfNull(dot);

        int vnetFrames = XDocument.Parse(svg)
            .Descendants()
            .Count(element => element.Attribute("class")?.Value == "vnet-frame");
        int subnetFrames = XDocument.Parse(svg)
            .Descendants()
            .Count(element => element.Attribute("class")?.Value == "subnet-frame");

        int dotVnetClusters = CountDotClusterLines(dot, "cluster_vnet_");
        int dotSubnetClusters = CountDotClusterLines(dot, "cluster_subnet_");

        dotVnetClusters.Should().Be(vnetFrames, "each forest VNet frame should have a matching Graphviz cluster");
        dotSubnetClusters.Should().Be(subnetFrames, "each forest subnet frame should have a matching Graphviz cluster");
    }

    private static int CountDotClusterLines(string dot, string clusterToken)
    {
        return dot.Split('\n')
            .Count(line => line.Contains("subgraph ", StringComparison.Ordinal)
                && line.Contains(clusterToken, StringComparison.Ordinal));
    }

    public static void AssertRoleColumnMarkersPresent(string svg, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(svg);

        if (mode is DiagramMode.DataFlow or DiagramMode.DataArchitecture)
        {
            CountRoleColumnMarkers(svg).Should().Be(0, "stage subgraphs keep LR layout instead of RG role columns");
            return;
        }

        if (mode is DiagramMode.Avd or DiagramMode.BusinessContinuity)
        {
            return;
        }

        CountRoleColumnMarkers(svg)
            .Should()
            .BeGreaterThan(0, $"IDX-07 mixed RG fixture should stamp data-role-column for {mode}");
    }

    public static void AssertRoleColumnMarkersAbsent(string svg, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(svg);

        CountRoleColumnMarkers(svg).Should().Be(0, mode.ToString());
    }

    public static void AssertHubSpokeHubMarkerPresent(string svg)
    {
        ArgumentNullException.ThrowIfNull(svg);

        XDocument.Parse(svg)
            .Descendants()
            .Any(element => element.Attribute("data-hub-spoke")?.Value == "hub")
            .Should()
            .BeTrue("IDX-07 hub-spoke layout should stamp the hub node");
    }

    public static void AssertHubSpokeHubMarkerAbsent(string svg, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(svg);

        XDocument.Parse(svg)
            .Descendants()
            .Any(element => element.Attribute("data-hub-spoke")?.Value == "hub")
            .Should()
            .BeFalse($"role-column layouts should not stamp hub-spoke hubs ({mode})");
    }

    private static int CountRoleColumnMarkers(string svg)
    {
        return XDocument.Parse(svg)
            .Descendants()
            .Count(element => element.Attribute("data-role-column") is not null);
    }
}
