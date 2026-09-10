using ArchLucid.Core.ProductLine;

namespace ArchLucid.Core.ProductCapability;

/// <summary>
///     Pure evaluator for OP-04. Shared (<c>both</c>) and <c>disputed</c> map rows always allow. Effective
///     <see cref="EffectiveProductLineKind.Both" /> allows exclusive rows for either shell (local dual-UI).
/// </summary>
public static class ProductLineRouteGateEvaluator
{
    public static ProductLineRouteGateDecision Evaluate(
        EffectiveProductLineKind effectiveProductLine,
        string? mapProductLine)
    {
        if (string.IsNullOrWhiteSpace(mapProductLine))
        {
            return ProductLineRouteGateDecision.UnmappedController;
        }

        if (IsSharedMapProductLine(mapProductLine))
        {
            return ProductLineRouteGateDecision.Allow;
        }

        if (effectiveProductLine == EffectiveProductLineKind.Both)
        {
            return ProductLineRouteGateDecision.Allow;
        }

        if (string.Equals(mapProductLine, "architecture", StringComparison.OrdinalIgnoreCase)
            && effectiveProductLine == EffectiveProductLineKind.Security)
        {
            return ProductLineRouteGateDecision.Forbidden;
        }

        if (string.Equals(mapProductLine, "security", StringComparison.OrdinalIgnoreCase)
            && effectiveProductLine == EffectiveProductLineKind.Architecture)
        {
            return ProductLineRouteGateDecision.Forbidden;
        }

        return ProductLineRouteGateDecision.Allow;
    }

    private static bool IsSharedMapProductLine(string mapProductLine) =>
        string.Equals(mapProductLine, "both", StringComparison.OrdinalIgnoreCase)
        || string.Equals(mapProductLine, "disputed", StringComparison.OrdinalIgnoreCase);
}
