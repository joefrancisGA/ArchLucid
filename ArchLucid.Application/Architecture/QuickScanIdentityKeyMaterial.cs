using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Architecture;

/// <summary>Privacy-minimized counter key helpers for Quick Scan identity abuse (TB-897).</summary>
public static class QuickScanIdentityKeyMaterial
{
    public static string HashIdentity(string rawValue)
    {
        string value = string.IsNullOrWhiteSpace(rawValue) ? "unknown" : rawValue.Trim();
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));

        return Convert.ToHexString(hash).ToLowerInvariant()[..32];
    }

    public static string NormalizeIpRange(string clientIp)
    {
        if (!IPAddress.TryParse(clientIp, out IPAddress? address))
            return "unknown";

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            byte[] bytes = address.GetAddressBytes();

            return $"{bytes[0]}.{bytes[1]}.{bytes[2]}.0/24";
        }

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            byte[] bytes = address.GetAddressBytes();

            // /48 aggregate: first 6 octets.
            return
                $"{bytes[0]:x2}{bytes[1]:x2}:{bytes[2]:x2}{bytes[3]:x2}:{bytes[4]:x2}{bytes[5]:x2}::/48";
        }

        return "unknown";
    }

    public static string BuildCounterKey(string layer, string identityHash, string periodBucket) =>
        $"{layer}:{identityHash}:{periodBucket}";
}
