using System.Net;
using System.Net.Sockets;

namespace ArchLucid.Core.Security;

/// <summary>
///     Re-validates outbound HTTPS targets after DNS resolution so hostname rebinding cannot reach private networks.
/// </summary>
public static class OutboundHttpsUrlDnsResolutionGuard
{
    /// <summary>Returns a problem detail when any resolved address is forbidden.</summary>
    public static async Task<string?> TryGetRejectionReasonAfterDnsResolveAsync(
        string rawUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return "URL is required.";

        if (!Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out Uri? uri))
            return "URL must be an absolute HTTPS URI.";

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return "URL must use the https scheme.";

        if (EmbeddedCredentialUrlGuard.HasEmbeddedCredentials(uri))
            return "URL must not include embedded credentials.";

        string host = uri.IdnHost;

        if (PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host))
            return "URL must not target loopback, link-local, or private network addresses.";

        if (IPAddress.TryParse(host, out IPAddress? literal))
        {
            return PrivateNetworkAddressGuard.IsForbiddenIpAddress(literal)
                ? "URL must not target loopback, link-local, or private network addresses."
                : null;
        }

        IPAddress[] addresses;

        try
        {
            addresses = await Dns.GetHostAddressesAsync(host, cancellationToken).ConfigureAwait(false);
        }
        catch (SocketException)
        {
            return "URL hostname could not be resolved.";
        }

        if (addresses.Length == 0)
            return "URL hostname could not be resolved.";

        foreach (IPAddress address in addresses)
        {
            if (PrivateNetworkAddressGuard.IsForbiddenIpAddress(address))
                return "URL resolves to a loopback, link-local, or private network address.";
        }

        return null;
    }
}
