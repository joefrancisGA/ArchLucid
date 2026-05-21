using System.Net.Http;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Auth.Saml;

namespace ArchLucid.Api.Services.Admin;

/// <inheritdoc cref="IIdentityProviderDiscoveryService" />
public sealed class IdentityProviderDiscoveryService(HttpClient httpClient) : IIdentityProviderDiscoveryService
{
    private static readonly string[] DefaultOidcClaimNames =
    [
        "groups",
        "roles",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
        "memberOf"
    ];

    private readonly HttpClient _httpClient =
        httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    /// <inheritdoc />
    public async Task<IdentityProviderDiscoverResponse> DiscoverAsync(
        IdentityProviderDiscoverRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string protocol = request.Protocol?.Trim().ToLowerInvariant() ?? string.Empty;
        string metadataUrl = request.MetadataUrl?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(protocol))
            return Failed(protocol, "Protocol is required (oidc or saml).");

        if (string.IsNullOrWhiteSpace(metadataUrl))
            return Failed(protocol, "MetadataUrl is required.");

        if (!Uri.TryCreate(metadataUrl, UriKind.Absolute, out Uri? metadataUri))
            return Failed(protocol, "MetadataUrl must be an absolute HTTP(S) URL.");

        return protocol switch
        {
            "oidc" => await DiscoverOidcAsync(protocol, metadataUri, cancellationToken).ConfigureAwait(false),
            "saml" => await DiscoverSamlAsync(protocol, metadataUri, cancellationToken).ConfigureAwait(false),
            _ => Failed(protocol, "Protocol must be oidc or saml.")
        };
    }

    private async Task<IdentityProviderDiscoverResponse> DiscoverOidcAsync(
        string protocol,
        Uri metadataUri,
        CancellationToken cancellationToken)
    {
        Uri discoveryUri = BuildOidcDiscoveryUri(metadataUri);

        try
        {
            using HttpResponseMessage response =
                await _httpClient.GetAsync(discoveryUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                    .ConfigureAwait(false);

            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return Failed(protocol, $"HTTP {(int)response.StatusCode} when fetching OpenID configuration.");
            }

            using JsonDocument document = JsonDocument.Parse(body);
            JsonElement root = document.RootElement;

            string? issuer = ReadString(root, "issuer");
            string? jwksUri = ReadString(root, "jwks_uri");
            List<string> thumbprints = [];

            if (!string.IsNullOrWhiteSpace(jwksUri)
                && Uri.TryCreate(jwksUri, UriKind.Absolute, out Uri? jwksUriParsed))
            {
                thumbprints = await FetchJwksThumbprintsAsync(jwksUriParsed, cancellationToken).ConfigureAwait(false);
            }

            return new IdentityProviderDiscoverResponse
            {
                Protocol = protocol,
                IssuerUri = issuer,
                JwksUri = jwksUri,
                SigningCertificateThumbprints = thumbprints,
                AvailableClaimNames = DefaultOidcClaimNames,
                DiscoverySucceeded = !string.IsNullOrWhiteSpace(issuer),
                DiagnosticSummary = string.IsNullOrWhiteSpace(issuer)
                    ? "OpenID configuration fetched but issuer was missing."
                    : "OpenID configuration fetched successfully."
            };
        }
        catch (OperationCanceledException)
        {
            if (cancellationToken.IsCancellationRequested)
                throw;

            return Failed(protocol, "Request timed out reaching the OpenID configuration URL.");
        }
        catch (HttpRequestException ex)
        {
            return Failed(protocol, SanitizeMessage(ex.Message));
        }
        catch (JsonException ex)
        {
            return Failed(protocol, $"OpenID configuration response was not valid JSON ({ex.Message}).");
        }
    }

    private async Task<IdentityProviderDiscoverResponse> DiscoverSamlAsync(
        string protocol,
        Uri metadataUri,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response =
                await _httpClient.GetAsync(metadataUri, cancellationToken).ConfigureAwait(false);

            string xml = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
                return Failed(protocol, $"HTTP {(int)response.StatusCode} when fetching SAML metadata.");

            SamlMetadataDiscoveryResult parsed = SamlMetadataDiscoveryParser.Parse(xml);

            return new IdentityProviderDiscoverResponse
            {
                Protocol = protocol,
                IssuerUri = parsed.IssuerUri,
                SigningCertificateThumbprints = parsed.SigningCertificateThumbprints,
                AvailableClaimNames = parsed.AvailableClaimNames,
                DiscoverySucceeded = true,
                DiagnosticSummary = "SAML metadata fetched and parsed successfully."
            };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (InvalidOperationException ex)
        {
            return Failed(protocol, ex.Message);
        }
        catch (System.Xml.XmlException ex)
        {
            return Failed(protocol, $"SAML metadata was not valid XML ({ex.Message}).");
        }
        catch (HttpRequestException ex)
        {
            return Failed(protocol, SanitizeMessage(ex.Message));
        }
    }

    private async Task<List<string>> FetchJwksThumbprintsAsync(Uri jwksUri, CancellationToken cancellationToken)
    {
        List<string> thumbprints = [];

        using HttpResponseMessage response =
            await _httpClient.GetAsync(jwksUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
            return thumbprints;

        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        using JsonDocument document = JsonDocument.Parse(body);

        if (!document.RootElement.TryGetProperty("keys", out JsonElement keys)
            || keys.ValueKind != JsonValueKind.Array)
            return thumbprints;

        foreach (JsonElement key in keys.EnumerateArray())
        {
            string? thumbprint = TryExtractJwksThumbprint(key);

            if (!string.IsNullOrWhiteSpace(thumbprint)
                && !thumbprints.Contains(thumbprint, StringComparer.OrdinalIgnoreCase))
                thumbprints.Add(thumbprint.ToUpperInvariant());
        }

        return thumbprints;
    }

    private static string? TryExtractJwksThumbprint(JsonElement key)
    {
        if (key.TryGetProperty("x5t", out JsonElement x5t))
        {
            string? value = x5t.GetString();

            if (!string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        if (!key.TryGetProperty("x5c", out JsonElement x5c)
            || x5c.ValueKind != JsonValueKind.Array
            || x5c.GetArrayLength() == 0)
            return null;

        string? certBase64 = x5c[0].GetString();

        if (string.IsNullOrWhiteSpace(certBase64))
            return null;

        try
        {
            byte[] raw = Convert.FromBase64String(certBase64);
            using X509Certificate2 certificate = X509CertificateLoader.LoadCertificate(raw);

            return certificate.Thumbprint;
        }
        catch (FormatException)
        {
            return null;
        }
        catch (CryptographicException)
        {
            return null;
        }
    }

    private static Uri BuildOidcDiscoveryUri(Uri metadataUri)
    {
        string absolute = metadataUri.AbsoluteUri.TrimEnd('/');

        if (absolute.EndsWith("/.well-known/openid-configuration", StringComparison.OrdinalIgnoreCase))
            return metadataUri;

        string discovery = $"{absolute}/.well-known/openid-configuration";

        if (!Uri.TryCreate(discovery, UriKind.Absolute, out Uri? built))
            throw new InvalidOperationException("Could not build OpenID discovery URL.");

        return built;
    }

    private static string? ReadString(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out JsonElement prop))
            return null;

        string? value = prop.GetString();

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static IdentityProviderDiscoverResponse Failed(string protocol, string message) =>
        new()
        {
            Protocol = protocol,
            DiscoverySucceeded = false,
            DiagnosticSummary = message
        };

    private static string SanitizeMessage(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return "HTTP request failed.";

        int newline = message.AsSpan().IndexOfAny('\r', '\n');

        return newline >= 0 ? message[..newline].Trim() : message.Trim();
    }
}
