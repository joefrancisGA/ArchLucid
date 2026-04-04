using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;

using ArchiForge.Host.Core.Configuration;

using Microsoft.Extensions.Primitives;

using Microsoft.Extensions.Options;

namespace ArchiForge.Host.Core.Middleware;

/// <summary>
/// Requires HTTP Basic authentication for the Prometheus scrape path when scrape credentials are configured.
/// Runs ahead of <c>UseOpenTelemetryPrometheusScrapingEndpoint</c>.
/// </summary>
public sealed class PrometheusScrapeAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly PathString _scrapePath;
    private readonly string? _expectedUser;
    private readonly string? _expectedPassword;

    public PrometheusScrapeAuthMiddleware(
        RequestDelegate next,
        IOptions<ObservabilityHostOptions> options)
    {
        ArgumentNullException.ThrowIfNull(next);
        ArgumentNullException.ThrowIfNull(options);

        _next = next;
        ObservabilityPrometheusOptions o = options.Value?.Prometheus ?? new ObservabilityPrometheusOptions();
        string path = string.IsNullOrWhiteSpace(o.ScrapePath) ? "/metrics" : o.ScrapePath.Trim();
        if (!path.StartsWith('/'))
            path = "/" + path;

        _scrapePath = new PathString(path);
        _expectedUser = string.IsNullOrWhiteSpace(o.ScrapeUsername) ? null : o.ScrapeUsername.Trim();
        _expectedPassword = string.IsNullOrWhiteSpace(o.ScrapePassword) ? null : o.ScrapePassword;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (_expectedUser is null || _expectedPassword is null)
        {
            await _next(context);

            return;
        }

        if (!context.Request.Path.StartsWithSegments(_scrapePath))
        {
            await _next(context);

            return;
        }

        if (!TryValidateBasicAuth(context.Request.Headers.Authorization, _expectedUser, _expectedPassword))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.Headers.WWWAuthenticate = "Basic realm=\"prometheus\", charset=\"UTF-8\"";

            return;
        }

        await _next(context);
    }

    private static bool TryValidateBasicAuth(
        StringValues authorizationHeader,
        string expectedUser,
        string expectedPassword)
    {
        if (!AuthenticationHeaderValue.TryParse(authorizationHeader.ToString(), out AuthenticationHeaderValue? header) ||
            header is null ||
            !string.Equals(header.Scheme, "Basic", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrEmpty(header.Parameter))
        {
            return false;
        }

        string decoded;
        try
        {
            byte[] bytes = Convert.FromBase64String(header.Parameter);
            decoded = Encoding.UTF8.GetString(bytes);
        }
        catch (FormatException)
        {
            return false;
        }

        int colon = decoded.IndexOf(':');
        if (colon < 0)
            return false;

        string user = decoded[..colon];
        string password = decoded[(colon + 1)..];

        return FixedTimeEquals(user, expectedUser) && FixedTimeEquals(password, expectedPassword);
    }

    /// <summary>Length-sensitive comparison to reduce timing leaks on the scrape secret.</summary>
    private static bool FixedTimeEquals(string a, string b)
    {
        ReadOnlySpan<byte> aBytes = Encoding.UTF8.GetBytes(a);
        ReadOnlySpan<byte> bBytes = Encoding.UTF8.GetBytes(b);

        return CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }
}
