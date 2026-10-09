namespace ArchLucid.Core.AzureExtractor;

/// <summary>Outline-only route sentences for workloads (NR-23).</summary>
public static class InventoryDiagramRouteOutlineSentenceFormatter
{
    public static string? TryFormat(AzureInventoryRouteTableRoute route, string? resolvedNextHopName)
    {
        ArgumentNullException.ThrowIfNull(route);

        string addressPrefix = string.IsNullOrWhiteSpace(route.AddressPrefix)
            ? "Address prefix was not stored"
            : route.AddressPrefix.Trim();
        string nextHopType = route.NextHopType?.Trim() ?? string.Empty;

        if (nextHopType.Equals("Internet", StringComparison.OrdinalIgnoreCase))
        {
            return "Outbound internet is sent directly";
        }

        if (nextHopType.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            return string.IsNullOrWhiteSpace(route.AddressPrefix)
                ? "Address prefix was not stored"
                : $"Traffic to {addressPrefix} is dropped";
        }

        if (addressPrefix.Equals("0.0.0.0/0", StringComparison.Ordinal))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(resolvedNextHopName))
        {
            if (RequiresResolvableNextHop(route))
            {
                return "route next hop does not resolve";
            }

            return null;
        }

        return $"Traffic to {addressPrefix} goes through {resolvedNextHopName}";
    }

    private static bool RequiresResolvableNextHop(AzureInventoryRouteTableRoute route)
    {
        string nextHopType = route.NextHopType?.Trim() ?? string.Empty;

        if (nextHopType.Equals("Internet", StringComparison.OrdinalIgnoreCase)
            || nextHopType.Equals("VnetLocal", StringComparison.OrdinalIgnoreCase)
            || nextHopType.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }
}
