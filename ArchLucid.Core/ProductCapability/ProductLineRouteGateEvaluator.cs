using ArchLucid.Core.ProductLine;

namespace ArchLucid.Core.ProductCapability;

/// <summary>
///     Pure evaluator for OP-04. Shared (<c>both</c>) and <c>disputed</c> map rows always allow. Effective
///     <see cref="EffectiveProductLineKind.Both" /> and <see cref="EffectiveProductLineKind.Architecture" /> may call
///     any mapped route; only <see cref="EffectiveProductLineKind.Security" /> is blocked from architecture-only rows.
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

        if (effectiveProductLine == EffectiveProductLineKind.Both
            || effectiveProductLine == EffectiveProductLineKind.Architecture)
        {
            return ProductLineRouteGateDecision.Allow;
        }

        if (string.Equals(mapProductLine, "architecture", StringComparison.OrdinalIgnoreCase)
            && effectiveProductLine == EffectiveProductLineKind.Security)
        {
            return ProductLineRouteGateDecision.Forbidden;
        }

        return ProductLineRouteGateDecision.Allow;
    }

    private static bool IsSharedMapProductLine(string mapProductLine) =>
        string.Equals(mapProductLine, "both", StringComparison.OrdinalIgnoreCase)
        || string.Equals(mapProductLine, "disputed", StringComparison.OrdinalIgnoreCase);
}
