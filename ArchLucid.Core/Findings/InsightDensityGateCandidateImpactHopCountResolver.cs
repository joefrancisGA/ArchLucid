using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Reads path-engine hop counts already stored on finding payloads for insight-density gate scoring (DX-65).
/// </summary>
internal static class InsightDensityGateCandidateImpactHopCountResolver
{
    public static int? TryResolveImpactHopCount(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Payload is null)
        {
            return null;
        }

        string engineType = finding.EngineType?.Trim() ?? string.Empty;

        if (engineType.Equals("identity-blast-radius", StringComparison.OrdinalIgnoreCase)
            || engineType.Equals("data-flow-trust-boundary", StringComparison.OrdinalIgnoreCase))
        {
            return TryReadIntProperty(finding.Payload, "HopCount");
        }

        if (engineType.Equals("segmentation-semantics", StringComparison.OrdinalIgnoreCase))
        {
            return TryReadIntProperty(finding.Payload, "HopCountToTarget");
        }

        return null;
    }

    private static int? TryReadIntProperty(object payload, string propertyName)
    {
        System.Reflection.PropertyInfo? property = payload.GetType().GetProperty(propertyName);

        if (property is null || property.PropertyType != typeof(int))
        {
            return null;
        }

        object? value = property.GetValue(payload);

        if (value is not int hopCount || hopCount < 1)
        {
            return null;
        }

        return hopCount;
    }
}
