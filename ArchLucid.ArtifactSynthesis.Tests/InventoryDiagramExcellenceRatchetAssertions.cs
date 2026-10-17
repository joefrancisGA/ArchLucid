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
            label.Should().Contain("peering", because: "honest verb catalog");
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
}
