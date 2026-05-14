using System.Net.Http;
using System.Text.Json;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Services.Admin;

/// <inheritdoc cref="IOidcWellKnownDiagnosticsService" />
public sealed class OidcWellKnownDiagnosticsService(
    HttpClient httpClient,
    IOptionsMonitor<ArchLucidAuthOptions> authOptionsMonitor) : IOidcWellKnownDiagnosticsService
{
    private readonly HttpClient _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    private readonly IOptionsMonitor<ArchLucidAuthOptions> _authOptionsMonitor =
        authOptionsMonitor ?? throw new ArgumentNullException(nameof(authOptionsMonitor));

    /// <inheritdoc />
    public async Task<AdminOidcDiagnosticsResponse> BuildAsync(CancellationToken cancellationToken)
    {
        ArchLucidAuthOptions opts = _authOptionsMonitor.CurrentValue;

        string modeTrim = opts.Mode?.Trim() ?? string.Empty;
        string? authorityConfigured = TrimOrNull(opts.Authority);
        string? audienceConfigured = TrimOrNull(opts.Audience);
        bool usesLocalKey = !string.IsNullOrWhiteSpace(opts.JwtSigningPublicKeyPemPath?.Trim());

        AdminOidcDiagnosticsResponse response = new()
        {
            AuthMode = modeTrim,
            ConfiguredAuthority = authorityConfigured,
            ConfiguredAudience = audienceConfigured,
            UsesLocalJwtSigningKey = usesLocalKey,
            LocalJwtIssuer = usesLocalKey ? TrimOrNull(opts.JwtLocalIssuer) : null,
            LocalJwtAudience = usesLocalKey ? TrimOrNull(opts.JwtLocalAudience) : null
        };

        if (!string.Equals(modeTrim, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            response.DiagnosticSummary =
                "ArchLucidAuth:Mode is not JwtBearer; OpenID Connect discovery is not used for API JWT validation.";

            return response;
        }

        if (usesLocalKey)
        {
            response.DiagnosticSummary =
                "JWT validation uses ArchLucidAuth:JwtSigningPublicKeyPemPath with local issuer/audience; OIDC metadata is not fetched from Authority at runtime.";

            return response;
        }

        if (authorityConfigured is null)
        {
            response.DiagnosticSummary = "ArchLucidAuth:Authority is empty; cannot resolve OpenID Connect metadata.";
            response.DiscoveryAttempted = false;
            response.DiscoverySucceeded = false;
            response.DiscoveryError = response.DiagnosticSummary;

            return response;
        }

        if (!TryBuildDiscoveryUri(authorityConfigured, out Uri? discoveryUri))
        {
            string msg = "ArchLucidAuth:Authority is not a valid absolute HTTP(S) URL.";
            response.DiagnosticSummary = msg;
            response.DiscoveryAttempted = false;
            response.DiscoverySucceeded = false;
            response.DiscoveryError = msg;

            return response;
        }

        string discoveryUrl = discoveryUri!.AbsoluteUri;
        response.OpenIdConfigurationUrl = discoveryUrl;
        response.DiscoveryAttempted = true;

        try
        {
            using HttpResponseMessage httpResponse =
                await _httpClient.GetAsync(discoveryUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            string body = await httpResponse.Content.ReadAsStringAsync(cancellationToken);

            if (!httpResponse.IsSuccessStatusCode)
            {
                response.DiscoverySucceeded = false;
                response.DiscoveryError = $"HTTP {(int)httpResponse.StatusCode} when fetching OpenID configuration.";
                response.DiagnosticSummary = response.DiscoveryError;

                return response;
            }

            using JsonDocument document = JsonDocument.Parse(body);
            JsonElement root = document.RootElement;

            response.DiscoverySucceeded = true;
            response.IssuerFromDiscovery = ReadDiscoveryString(root, "issuer");
            response.AuthorizationEndpoint = ReadDiscoveryString(root, "authorization_endpoint");
            response.TokenEndpoint = ReadDiscoveryString(root, "token_endpoint");
            response.JwksUri = ReadDiscoveryString(root, "jwks_uri");
            response.UserinfoEndpoint = ReadDiscoveryString(root, "userinfo_endpoint");
            response.DiagnosticSummary = "OpenID configuration document fetched successfully.";
        }
        catch (OperationCanceledException)
        {
            if (cancellationToken.IsCancellationRequested)
                throw;

            // HttpClient timeouts surface as TaskCanceledException (derived from OperationCanceledException).
            response.DiscoverySucceeded = false;
            response.DiscoveryError = "Request timed out reaching the OpenID configuration URL.";
            response.DiagnosticSummary = response.DiscoveryError;
        }
        catch (HttpRequestException ex)
        {
            response.DiscoverySucceeded = false;
            response.DiscoveryError = SanitizeDiscoveryTransportMessage(ex.Message);
            response.DiagnosticSummary = response.DiscoveryError;
        }
        catch (JsonException ex)
        {
            response.DiscoverySucceeded = false;
            response.DiscoveryError = $"OpenID configuration response was not valid JSON ({ex.Message}).";
            response.DiagnosticSummary = response.DiscoveryError;
        }

        return response;
    }

    private static bool TryBuildDiscoveryUri(string authorityTrimmed, out Uri? discoveryUri)
    {
        discoveryUri = null;

        if (!Uri.TryCreate(authorityTrimmed.TrimEnd('/'), UriKind.Absolute, out Uri? authorityUri))
            return false;

        if (authorityUri.Scheme != Uri.UriSchemeHttp && authorityUri.Scheme != Uri.UriSchemeHttps)
            return false;

        string discovery = $"{authorityUri.AbsoluteUri.TrimEnd('/')}/.well-known/openid-configuration";

        if (!Uri.TryCreate(discovery, UriKind.Absolute, out Uri? built))
            return false;

        discoveryUri = built;

        return true;
    }

    private static string? TrimOrNull(string? value)
    {
        string? trimmed = value?.Trim();

        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static string? ReadDiscoveryString(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out JsonElement prop))
            return null;

        string? s = prop.GetString();

        return string.IsNullOrWhiteSpace(s) ? null : s.Trim();
    }

    /// <summary>
    ///     Avoid multi-line exception noise in operator JSON while keeping the first line (often useful for TLS/DNS hints).
    /// </summary>
    private static string SanitizeDiscoveryTransportMessage(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return "HTTP request to OpenID configuration URL failed.";

        int newline = message.AsSpan().IndexOfAny('\r', '\n');

        return newline >= 0 ? message[..newline].Trim() : message.Trim();
    }
}
