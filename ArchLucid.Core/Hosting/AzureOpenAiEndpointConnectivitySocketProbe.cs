using System.Net.Sockets;

namespace ArchLucid.Core.Hosting;

/// <summary>Minimal TCP connectivity probe for HTTPS (or HTTP) authority URLs.</summary>
public static class AzureOpenAiEndpointConnectivitySocketProbe
{
    /// <summary>
    ///     Opens a TCP connection to <paramref name="authorityUri" /> host/default port (443 for https).
    /// </summary>
    public static async Task<bool> IsTcpReachableAsync(Uri authorityUri, CancellationToken cancellationToken)
    {
        if (authorityUri is null) throw new ArgumentNullException(nameof(authorityUri));

        string host = authorityUri.Host;

        int port = authorityUri.IsDefaultPort
            ? string.Equals(authorityUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
                ? 443
                : 80
            : authorityUri.Port;

        using TcpClient tcp = new();

        await tcp.ConnectAsync(host, port, cancellationToken).ConfigureAwait(false);

        return true;
    }
}
