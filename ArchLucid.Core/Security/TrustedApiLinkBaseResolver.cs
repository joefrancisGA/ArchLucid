using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Security;

/// <summary>
///     Resolves a stable public API base URL for PDF/export deep links — avoids trusting hostile <c>Host</c> headers (BE-054).
/// </summary>
public static class TrustedApiLinkBaseResolver
{
    public const string PublicApiBaseUrlConfigurationKey = "ArchLucid:PublicApiBaseUrl";

    /// <summary>
    ///     Prefer <see cref="PublicApiBaseUrlConfigurationKey" />; otherwise use the request only when the host is not
    ///     a private/loopback literal.
    /// </summary>
    public static string Resolve(IConfiguration configuration, string? requestScheme, string? requestHost)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? configured = configuration[PublicApiBaseUrlConfigurationKey]?.Trim();

        if (!string.IsNullOrWhiteSpace(configured))
            return configured.TrimEnd('/');

        string scheme = string.IsNullOrWhiteSpace(requestScheme) ? Uri.UriSchemeHttps : requestScheme.Trim();
        string host = string.IsNullOrWhiteSpace(requestHost) ? "localhost" : requestHost.Trim();

        if (PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host))
            return "http://localhost:5000";

        return $"{scheme}://{host}".TrimEnd('/');
    }
}
