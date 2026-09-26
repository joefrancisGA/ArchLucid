using System.Net;
using System.Net.Sockets;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     IPv4 CIDR matching for NR-09 NSG rule address-prefix applicability.
/// </summary>
public static class InventoryDiagramDataFlowNsgAddressPrefixMatcher
{
    public static bool IsWildcard(string? prefix)
    {
        return string.IsNullOrWhiteSpace(prefix) || string.Equals(prefix.Trim(), "*", StringComparison.Ordinal);
    }

    public static bool IsCidrOrIp(string prefix)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(prefix);

        string trimmed = prefix.Trim();

        if (IsWildcard(trimmed))
        {
            return false;
        }

        int slashIndex = trimmed.IndexOf('/');

        if (slashIndex < 0)
        {
            return TryParseIpv4(trimmed, out _);
        }

        if (slashIndex == 0 || slashIndex >= trimmed.Length - 1)
        {
            return false;
        }

        string networkPart = trimmed[..slashIndex];
        string prefixLengthPart = trimmed[(slashIndex + 1)..];

        if (!TryParseIpv4(networkPart, out _))
        {
            return false;
        }

        return int.TryParse(prefixLengthPart, out int prefixLength)
            && prefixLength >= 0
            && prefixLength <= 32;
    }

    public static bool Contains(string ruleCidr, string address)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(ruleCidr);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);

        if (!TryParseCidr(ruleCidr, out uint network, out uint mask)
            || !TryParseIpv4(address, out uint parsedAddress))
        {
            return false;
        }

        return (parsedAddress & mask) == (network & mask);
    }

    public static bool Overlaps(string cidrA, string cidrB)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(cidrA);
        ArgumentException.ThrowIfNullOrWhiteSpace(cidrB);

        if (!TryParseCidr(cidrA, out uint networkA, out uint maskA)
            || !TryParseCidr(cidrB, out uint networkB, out uint maskB))
        {
            return false;
        }

        uint startA = networkA & maskA;
        uint endA = startA | ~maskA;
        uint startB = networkB & maskB;
        uint endB = startB | ~maskB;

        return startA <= endB && startB <= endA;
    }

    private static bool TryParseCidr(string cidr, out uint network, out uint mask)
    {
        network = 0;
        mask = 0;

        string trimmed = cidr.Trim();
        int slashIndex = trimmed.IndexOf('/');

        if (slashIndex < 0)
        {
            if (!TryParseIpv4(trimmed, out network))
            {
                return false;
            }

            mask = 0xFFFFFFFF;
            return true;
        }

        if (!TryParseIpv4(trimmed[..slashIndex], out network)
            || !int.TryParse(trimmed[(slashIndex + 1)..], out int prefixLength)
            || prefixLength < 0
            || prefixLength > 32)
        {
            return false;
        }

        mask = prefixLength == 0 ? 0 : uint.MaxValue << (32 - prefixLength);
        network &= mask;
        return true;
    }

    private static bool TryParseIpv4(string value, out uint address)
    {
        address = 0;

        if (!IPAddress.TryParse(value.Trim(), out IPAddress? parsed)
            || parsed.AddressFamily is not AddressFamily.InterNetwork)
        {
            return false;
        }

        byte[] bytes = parsed.GetAddressBytes();

        address = ((uint)bytes[0] << 24)
            | ((uint)bytes[1] << 16)
            | ((uint)bytes[2] << 8)
            | bytes[3];

        return true;
    }
}
