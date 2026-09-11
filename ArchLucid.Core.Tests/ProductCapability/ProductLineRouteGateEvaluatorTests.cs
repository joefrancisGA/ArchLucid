using ArchLucid.Core.ProductCapability;
using ArchLucid.Core.ProductLine;

using FluentAssertions;

namespace ArchLucid.Core.Tests.ProductCapability;

public sealed class ProductLineRouteGateEvaluatorTests
{
    [Theory]
    [InlineData(EffectiveProductLineKind.Security, "architecture", ProductLineRouteGateDecision.Forbidden)]
    [InlineData(EffectiveProductLineKind.Architecture, "security", ProductLineRouteGateDecision.Forbidden)]
    [InlineData(EffectiveProductLineKind.Security, "both", ProductLineRouteGateDecision.Allow)]
    [InlineData(EffectiveProductLineKind.Architecture, "both", ProductLineRouteGateDecision.Allow)]
    [InlineData(EffectiveProductLineKind.Both, "architecture", ProductLineRouteGateDecision.Allow)]
    [InlineData(EffectiveProductLineKind.Both, "security", ProductLineRouteGateDecision.Allow)]
    [InlineData(EffectiveProductLineKind.Security, "disputed", ProductLineRouteGateDecision.Allow)]
    [InlineData(EffectiveProductLineKind.Architecture, "architecture", ProductLineRouteGateDecision.Allow)]
    public void Evaluate_maps_effective_line_and_map_product_line(
        EffectiveProductLineKind effectiveLine,
        string mapProductLine,
        ProductLineRouteGateDecision expected)
    {
        ProductLineRouteGateEvaluator.Evaluate(effectiveLine, mapProductLine).Should().Be(expected);
    }

    [Fact]
    public void Evaluate_unmapped_controller_is_fail_closed()
    {
        ProductLineRouteGateEvaluator.Evaluate(EffectiveProductLineKind.Security, null)
            .Should().Be(ProductLineRouteGateDecision.UnmappedController);
    }
}
