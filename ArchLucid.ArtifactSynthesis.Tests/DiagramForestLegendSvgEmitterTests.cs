using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Diagrams;

using FluentAssertions;

using Xunit;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramForestLegendSvgEmitterTests
{
    private static readonly XNamespace Svg = "http://www.w3.org/2000/svg";

    [Fact]
    public void Emit_includes_unclassified_connector_row_when_flagged()
    {
        DiagramForestLegendSvgEmitter.LegendLayout layout = DiagramForestLegendSvgEmitter.Emit(
            Svg,
            new DiagramForestLegendSvgEmitter.LegendInput(
                UsedKinds: [],
                HasPrivateEndpointAccess: false,
                HasUnclassifiedConnectors: true,
                HasDashedPeeringEdges: false,
                HasResourceGroupFrames: false,
                RollupNodes: []),
            anchorX: 0,
            anchorY: 0);

        layout.Group.ToString(SaveOptions.DisableFormatting)
            .Should()
            .Contain(DiagramForestLegendSvgEmitter.UnclassifiedConnectorLegendRow);
    }

    [Fact]
    public void Emit_includes_private_endpoint_access_row_when_flagged()
    {
        DiagramForestLegendSvgEmitter.LegendLayout layout = DiagramForestLegendSvgEmitter.Emit(
            Svg,
            new DiagramForestLegendSvgEmitter.LegendInput(
                UsedKinds: [],
                HasPrivateEndpointAccess: true,
                HasUnclassifiedConnectors: false,
                HasDashedPeeringEdges: false,
                HasResourceGroupFrames: false,
                RollupNodes: []),
            anchorX: 0,
            anchorY: 0);

        layout.Group.ToString(SaveOptions.DisableFormatting).Should().Contain("Private endpoint access");
    }

    [Fact]
    public void Emit_labels_rollup_member_name_null_vs_empty()
    {
        DiagramNode rollup = new()
        {
            Label = "Data flow rollup",
            DataFlowRollupMemberNames = [null!, string.Empty, "  app-db  "],
        };

        DiagramForestLegendSvgEmitter.LegendLayout layout = DiagramForestLegendSvgEmitter.Emit(
            Svg,
            new DiagramForestLegendSvgEmitter.LegendInput(
                UsedKinds: [],
                HasPrivateEndpointAccess: false,
                HasUnclassifiedConnectors: false,
                HasDashedPeeringEdges: false,
                HasResourceGroupFrames: false,
                RollupNodes: [rollup]),
            anchorX: 0,
            anchorY: 0);

        string legendText = layout.Group.ToString(SaveOptions.DisableFormatting);

        legendText.Should().Contain("Rollup member name was not stored.");
        legendText.Should().Contain("Rollup member name was stored empty.");
        legendText.Should().Contain("app-db");
    }
}
