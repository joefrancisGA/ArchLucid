using System.Net;
using System.Net.Sockets;

namespace ArchLucid.Core.Security;

/// <summary>Shared loopback / RFC1918 / link-local checks for outbound HTTPS URL policies (TB-274).</summary>
public static class PrivateNetworkAddressGuard
{
    public static bool IsForbiddenHostLiteral(string host)
    {
        if (string.IsNullOrWhiteSpace(host))
            return true;

        if (string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase))
            return true;

        if (!IPAddress.TryParse(host, out IPAddress? ip))
            return false;

        return IsForbiddenIpAddress(ip);
    }

    public static bool IsForbiddenIpAddress(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip))
            return true;

        if (ip.AddressFamily is AddressFamily.InterNetwork)
        {
            byte[] b = ip.GetAddressBytes();

            switch (b[0])
            {
                case 10:
                case 172 when b[1] is >= 16 and <= 31:
                    return true;
            }

            if (b[0] is 192 && b[1] is 168)
                return true;

            if (b[0] is 169 && b[1] is 254)
                return true;
        }

        if (ip.AddressFamily is not AddressFamily.InterNetworkV6)
            return false;

        if (ip.IsIPv6LinkLocal || ip.IsIPv6Multicast)
            return true;

        byte firstOctet = ip.GetAddressBytes()[0];

        // IPv6 unique local addresses (fc00::/7) are non-routable like RFC1918.
        return firstOctet is 0xfc or 0xfd;
    }
}
