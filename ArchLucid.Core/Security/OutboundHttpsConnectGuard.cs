using System.Net;
using System.Net.Http;
using System.Net.Sockets;

namespace ArchLucid.Core.Security;

/// <summary>
///     Connect-time SSRF guard for outbound HTTPS probes — re-validates resolved endpoints at socket connect
///     so DNS rebinding cannot reach private networks after preflight checks.
/// </summary>
public static class OutboundHttpsConnectGuard
{
    /// <summary>Re-resolves DNS at connect time, rejects forbidden addresses, then opens the socket.</summary>
    public static async ValueTask<Stream> RejectPrivateNetworkAndConnectAsync(
        SocketsHttpConnectionContext context,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        DnsEndPoint dnsEndPoint = context.DnsEndPoint;
        IPAddress[] addresses = await Dns.GetHostAddressesAsync(
                dnsEndPoint.Host,
                dnsEndPoint.AddressFamily,
                cancellationToken)
            .ConfigureAwait(false);

        if (addresses.Length == 0)
        {
            throw new HttpRequestException("Connect target hostname could not be resolved.");
        }

        foreach (IPAddress address in addresses)
        {
            if (PrivateNetworkAddressGuard.IsForbiddenIpAddress(address))
            {
                throw new HttpRequestException(
                    "Connect target resolves to a loopback, link-local, or private network address.");
            }
        }

        Socket socket = new(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };

        try
        {
            await socket.ConnectAsync(addresses, dnsEndPoint.Port, cancellationToken).ConfigureAwait(false);

            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();

            throw;
        }
    }

    internal static void RejectIfForbidden(DnsEndPoint dnsEndPoint)
    {
        ArgumentNullException.ThrowIfNull(dnsEndPoint);

        string host = dnsEndPoint.Host;

        if (PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host))
        {
            throw new HttpRequestException(
                "Connect target must not use loopback, link-local, or private network addresses.");
        }

        if (IPAddress.TryParse(host, out IPAddress? address)
            && PrivateNetworkAddressGuard.IsForbiddenIpAddress(address))
        {
            throw new HttpRequestException(
                "Connect target resolves to a loopback, link-local, or private network address.");
        }
    }
}
