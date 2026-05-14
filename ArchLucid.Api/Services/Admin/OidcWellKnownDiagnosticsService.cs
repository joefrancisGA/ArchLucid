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
    private readonly HttpClient _httpClient =
        httpClient ?? throw new ArgumentNullException(nameof(httpClient));

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

        AdminOidcDiagnosticsResponse baseline = AuthBaseline(modeTrim, authorityConfigured, audienceConfigured,
            usesLocalKey, opts);

        if (!string.Equals(modeTrim, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            return baseline with
            {
                DiagnosticSummary =
                    "ArchLucidAuth:Mode is not JwtBearer; OpenID Connect discovery is not used for API JWT validation."
            };
        }

        if (usesLocalKey)
        {
            return baseline with
            {
                DiagnosticSummary =
                    "JWT validation uses ArchLucidAuth:JwtSigningPublicKeyPemPath with local issuer/audience; OIDC metadata is not fetched from Authority at runtime."
            };
        }

        if (authorityConfigured is null)
        {
            const string summary =
                "ArchLucidAuth:Authority is empty; cannot resolve OpenID Connect metadata.";

            return baseline with
            {
                DiagnosticSummary = summary,
                DiscoveryAttempted = false,
                DiscoverySucceeded = false,
                DiscoveryError = summary
            };
        }

        if (!TryBuildDiscoveryUri(authorityConfigured, out Uri? discoveryUri))
        {
            string msg = "ArchLucidAuth:Authority is not a valid absolute HTTP(S) URL.";

            return baseline with
            {
                DiagnosticSummary = msg,
                DiscoveryAttempted = false,
                DiscoverySucceeded = false,
                DiscoveryError = msg
            };
        }

        string discoveryUrl = discoveryUri!.AbsoluteUri;

        AdminOidcDiagnosticsResponse attempted = baseline with
        {
            OpenIdConfigurationUrl = discoveryUrl,
            DiscoveryAttempted = true
        };

        try
        {
            using HttpResponseMessage httpResponse =
                await _httpClient.GetAsync(discoveryUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            string body = await httpResponse.Content.ReadAsStringAsync(cancellationToken);

            if (!httpResponse.IsSuccessStatusCode)
            {
                string err = $"HTTP {(int)httpResponse.StatusCode} when fetching OpenID configuration.";

                return attempted with
                {
                    DiscoverySucceeded = false,
                    DiscoveryError = err,
                    DiagnosticSummary = err
                };
            }

            using JsonDocument document = JsonDocument.Parse(body);
            JsonElement root = document.RootElement;

            return attempted with
            {
                DiscoverySucceeded = true,
                IssuerFromDiscovery = ReadDiscoveryString(root, "issuer"),
                AuthorizationEndpoint = ReadDiscoveryString(root, "authorization_endpoint"),
                TokenEndpoint = ReadDiscoveryString(root, "token_endpoint"),
                JwksUri = ReadDiscoveryString(root, "jwks_uri"),
                UserinfoEndpoint = ReadDiscoveryString(root, "userinfo_endpoint"),
                DiagnosticSummary = "OpenID configuration document fetched successfully."
            };
        }
        catch (OperationCanceledException)
        {
            if (cancellationToken.IsCancellationRequested)
                throw;

            // HttpClient timeouts surface as TaskCanceledException (derived from OperationCanceledException).
            string err = "Request timed out reaching the OpenID configuration URL.";

            return attempted with
            {
                DiscoverySucceeded = false,
                DiscoveryError = err,
                DiagnosticSummary = err
            };
        }
        catch (HttpRequestException ex)
        {
            string err = SanitizeDiscoveryTransportMessage(ex.Message);

            return attempted with
            {
                DiscoverySucceeded = false,
                DiscoveryError = err,
                DiagnosticSummary = err
            };
        }
        catch (JsonException ex)
        {
            string err = $"OpenID configuration response was not valid JSON ({ex.Message}).";

            return attempted with
            {
                DiscoverySucceeded = false,
                DiscoveryError = err,
                DiagnosticSummary = err
            };
        }
    }

    private static AdminOidcDiagnosticsResponse AuthBaseline(
        string modeTrim,
        string? authorityConfigured,
        string? audienceConfigured,
        bool usesLocalKey,
        ArchLucidAuthOptions opts)
    {
        return new AdminOidcDiagnosticsResponse
        {
            AuthMode = modeTrim,
            ConfiguredAuthority = authorityConfigured,
            ConfiguredAudience = audienceConfigured,
            UsesLocalJwtSigningKey = usesLocalKey,
            LocalJwtIssuer = usesLocalKey ? TrimOrNull(opts.JwtLocalIssuer) : null,
            LocalJwtAudience = usesLocalKey ? TrimOrNull(opts.JwtLocalAudience) : null
        };
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
