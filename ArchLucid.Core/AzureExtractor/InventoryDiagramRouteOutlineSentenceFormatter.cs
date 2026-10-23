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
            if (string.IsNullOrWhiteSpace(route.AddressPrefix))
            {
                return "Address prefix was not stored. Next hop type is Internet.";
            }

            return $"Traffic to {addressPrefix} is sent directly to the internet.";
        }

        if (nextHopType.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            return string.IsNullOrWhiteSpace(route.AddressPrefix)
                ? "Address prefix was not stored"
                : $"Traffic to {addressPrefix} is dropped";
        }

        if (addressPrefix.Equals("0.0.0.0/0", StringComparison.Ordinal))
        {
            return string.IsNullOrWhiteSpace(nextHopType)
                ? "Default route 0.0.0.0/0 was not drawn. Next hop type was not stored."
                : $"Default route 0.0.0.0/0 was not drawn. Next hop type is {nextHopType}.";
        }

        if (nextHopType.Equals("VnetLocal", StringComparison.OrdinalIgnoreCase))
        {
            return string.IsNullOrWhiteSpace(route.AddressPrefix)
                ? "Address prefix was not stored. Next hop type is VnetLocal."
                : $"Traffic to {addressPrefix} uses next hop type VnetLocal.";
        }

        if (string.IsNullOrWhiteSpace(resolvedNextHopName))
        {
            if (string.IsNullOrWhiteSpace(route.NextHopType))
            {
                return "Next hop type was not stored";
            }

            if (RequiresResolvableNextHop(route))
            {
                string hopTypeLabel = string.IsNullOrWhiteSpace(nextHopType)
                    ? "Next hop type was not stored"
                    : nextHopType;

                return $"Next hop name was not stored for {hopTypeLabel} on {addressPrefix}.";
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
