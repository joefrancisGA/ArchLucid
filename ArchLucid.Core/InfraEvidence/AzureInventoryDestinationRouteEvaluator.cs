using System.Net;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>Evaluates a complete, already-effective route set for a concrete destination.
/// Does not infer effective routes from an incomplete user-defined route table.</summary>
public static class AzureInventoryDestinationRouteEvaluator
{
    public static AzurePrivateConnectivityCheck Evaluate(
        IReadOnlyList<AzureInventoryRouteTableRoute>? effectiveRoutes,
        string destinationAddress,
        bool complete,
        out AzureInventoryRouteTableRoute? selected)
    {
        selected = null;
        if (!complete || effectiveRoutes is null || !IPAddress.TryParse(destinationAddress, out IPAddress? destination))
            return AzurePrivateConnectivityCheck.Unknown;

        int bestPrefix = -1;
        foreach (AzureInventoryRouteTableRoute route in effectiveRoutes)
        {
            if (!TryReadPrefix(route.AddressPrefix, out IPAddress? network, out int length))
            {
                selected = null;
                return AzurePrivateConnectivityCheck.Unknown;
            }
            if (network!.AddressFamily != destination.AddressFamily || !Matches(network, destination, length))
                continue;
            if (length > bestPrefix)
            {
                bestPrefix = length;
                selected = route;
            }
            else if (length == bestPrefix && selected is not null
                && (!string.Equals(selected.NextHopType, route.NextHopType, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(selected.NextHopArmId, route.NextHopArmId, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(selected.NextHopIpAddress, route.NextHopIpAddress, StringComparison.OrdinalIgnoreCase)))
            {
                // Effective route precedence was not supplied for conflicting equal prefixes.
                selected = null;
            }
        }

        if (selected is null)
            return AzurePrivateConnectivityCheck.Unknown;

        return selected.NextHopType?.Trim().ToUpperInvariant() switch
        {
            "NONE" => AzurePrivateConnectivityCheck.Blocked,
            "INTERNET" => AzurePrivateConnectivityCheck.Blocked,
            "VNETLOCAL" or "VIRTUALNETWORK" or "VNETPEERING" or "VIRTUALNETWORKPEERING" or "INTERFACEENDPOINT" =>
                AzurePrivateConnectivityCheck.Supported,
            _ => AzurePrivateConnectivityCheck.Unknown,
        };
    }

    private static bool TryReadPrefix(string? value, out IPAddress? address, out int length)
    {
        address = null;
        length = 0;
        if (string.IsNullOrWhiteSpace(value))
            return false;
        string[] parts = value.Split('/');
        if (parts.Length != 2 || !IPAddress.TryParse(parts[0], out address) || address is null
            || !int.TryParse(parts[1], out length) || length < 0)
            return false;
        return length <= address.GetAddressBytes().Length * 8;
    }

    private static bool Matches(IPAddress network, IPAddress destination, int length)
    {
        byte[] left = network.GetAddressBytes();
        byte[] right = destination.GetAddressBytes();
        int wholeBytes = length / 8;
        for (int i = 0; i < wholeBytes; i++)
            if (left[i] != right[i])
                return false;
        int remaining = length % 8;
        if (remaining == 0)
            return true;
        int mask = 0xff << (8 - remaining);
        return (left[wholeBytes] & mask) == (right[wholeBytes] & mask);
    }
}
