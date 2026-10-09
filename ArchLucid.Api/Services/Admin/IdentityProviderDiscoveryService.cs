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

    // The wizard renders every name. Cap the union so a hostile metadata document cannot inflate the response.
    private const int MaxOidcAvailableClaimNames = 32;

    private const string OidcWellKnownSuffix = "/.well-known/openid-configuration";

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

        if (!IdentityProviderUriValidator.TryCreateAbsoluteHttpOrHttps(metadataUrl, out Uri metadataUri))
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
            bool issuerIsHttp = !string.IsNullOrWhiteSpace(issuer)
                && IdentityProviderUriValidator.TryCreateAbsoluteHttpOrHttps(issuer, out _);
            bool issuerMatchesMetadata = issuerIsHttp
                && IssuerMatchesMetadataUrl(metadataUri, issuer ?? string.Empty);
            List<string> thumbprints = [];

            // A substituted issuer must not trigger a second fetch of that document's jwks_uri.
            if (issuerMatchesMetadata
                && !string.IsNullOrWhiteSpace(jwksUri)
                && IdentityProviderUriValidator.TryCreateAbsoluteHttpOrHttps(jwksUri, out Uri jwksUriParsed))
            {
                thumbprints = await FetchJwksThumbprintsAsync(jwksUriParsed, cancellationToken).ConfigureAwait(false);
            }

            return new IdentityProviderDiscoverResponse
            {
                Protocol = protocol,
                IssuerUri = issuer,
                JwksUri = jwksUri,
                SigningCertificateThumbprints = thumbprints,
                AvailableClaimNames = ReadOidcAvailableClaimNames(root),
                DiscoverySucceeded = issuerMatchesMetadata,
                DiagnosticSummary = DescribeOidcIssuerOutcome(issuer, issuerIsHttp, issuerMatchesMetadata)
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

            string issuerUri = parsed.IssuerUri?.Trim() ?? string.Empty;

            bool issuerUsable = IdentityProviderUriValidator.TryCreateAbsoluteHttpOrHttps(issuerUri, out _);

            return new IdentityProviderDiscoverResponse
            {
                Protocol = protocol,
                IssuerUri = string.IsNullOrWhiteSpace(issuerUri) ? parsed.IssuerUri : issuerUri,
                SigningCertificateThumbprints = parsed.SigningCertificateThumbprints,
                AvailableClaimNames = parsed.AvailableClaimNames,
                DiscoverySucceeded = issuerUsable,
                DiagnosticSummary = issuerUsable
                    ? "SAML metadata fetched and parsed successfully."
                    : "SAML metadata was parsed but entityID was missing or not a valid HTTP(S) URL."
            };
        }
        catch (OperationCanceledException)
        {
            if (cancellationToken.IsCancellationRequested)
                throw;

            return Failed(protocol, "Request timed out reaching the SAML metadata URL.");
        }
        catch (ArgumentException ex)
        {
            return Failed(protocol, ex.Message);
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

        try
        {
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

                if (!IsJwksSigningKey(key))
                    continue;

                string? thumbprint = TryExtractJwksThumbprint(key);

                if (!string.IsNullOrWhiteSpace(thumbprint)
                    && !thumbprints.Contains(thumbprint, StringComparer.OrdinalIgnoreCase))
                    thumbprints.Add(thumbprint.ToUpperInvariant());
            }
        }
        catch (JsonException)
        {
            // HTTP errors already leave thumbprints empty. A non-JSON JWKS body is the same outcome.
            return thumbprints;
        }
        catch (HttpRequestException)
        {
            return thumbprints;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return thumbprints;
        }

        return thumbprints;
    }

    private static bool IsJwksSigningKey(JsonElement key)
    {
        // RFC 7517 use=enc is an encryption key. The wizard labels the thumbprint as a signing certificate.
        if (key.TryGetProperty("use", out JsonElement useElement)
            && useElement.ValueKind == JsonValueKind.String)
        {
            string use = useElement.GetString()?.Trim() ?? string.Empty;

            if (use.Equals("enc", StringComparison.OrdinalIgnoreCase))
                return false;

            if (use.Length > 0 && !use.Equals("sig", StringComparison.OrdinalIgnoreCase))
                return false;
        }

        if (!key.TryGetProperty("key_ops", out JsonElement keyOps)
            || keyOps.ValueKind != JsonValueKind.Array
            || keyOps.GetArrayLength() == 0)
        {
            return true;
        }

        foreach (JsonElement op in keyOps.EnumerateArray())
        {
            if (op.ValueKind != JsonValueKind.String)
                continue;

            string value = op.GetString()?.Trim() ?? string.Empty;

            if (value.Equals("sign", StringComparison.OrdinalIgnoreCase)
                || value.Equals("verify", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static string? TryExtractJwksThumbprint(JsonElement key)
    {
        // RFC 7517 x5t is base64url SHA-1. The wizard compares it to the hex thumbprint SAML discovery already shows.
        if (TryReadX5tHexThumbprint(key, out string? x5tHex))
            return x5tHex;

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

    private static bool TryReadX5tHexThumbprint(JsonElement key, out string? hexThumbprint)
    {
        hexThumbprint = null;

        if (!key.TryGetProperty("x5t", out JsonElement x5t) || x5t.ValueKind != JsonValueKind.String)
            return false;

        string? value = x5t.GetString();

        if (string.IsNullOrWhiteSpace(value))
            return false;

        string padded = value.Trim().Replace('-', '+').Replace('_', '/');
        int remainder = padded.Length % 4;

        if (remainder != 0)
            padded = padded.PadRight(padded.Length + (4 - remainder), '=');

        try
        {
            byte[] hash = Convert.FromBase64String(padded);

            if (hash.Length != 20)
                return false;

            hexThumbprint = Convert.ToHexString(hash);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static Uri BuildOidcDiscoveryUri(Uri metadataUri)
    {
        string path = metadataUri.AbsolutePath.TrimEnd('/');

        if (!path.EndsWith(OidcWellKnownSuffix, StringComparison.OrdinalIgnoreCase))
            path = $"{path}{OidcWellKnownSuffix}";

        // AbsoluteUri places the query after the path. Appending the well-known segment
        // there puts it inside the query (tenant=acme/.well-known/...).
        string discovery = $"{metadataUri.GetLeftPart(UriPartial.Authority)}{path}{metadataUri.Query}";

        if (!Uri.TryCreate(discovery, UriKind.Absolute, out Uri? built))
            throw new InvalidOperationException("Could not build OpenID discovery URL.");

        return built;
    }

    private static bool IssuerMatchesMetadataUrl(Uri metadataUri, string issuer)
    {
        if (!IdentityProviderUriValidator.TryGetCanonicalAbsoluteHttpOrHttps(issuer, out string canonicalIssuer))
            return false;

        if (!TryBuildExpectedIssuerUrl(metadataUri, out string expectedIssuer))
            return false;

        return string.Equals(
            NormalizeIssuerForComparison(canonicalIssuer),
            NormalizeIssuerForComparison(expectedIssuer),
            StringComparison.Ordinal);
    }

    private static bool TryBuildExpectedIssuerUrl(Uri metadataUri, out string expectedIssuer)
    {
        expectedIssuer = string.Empty;
        Uri discoveryUri = BuildOidcDiscoveryUri(metadataUri);
        string path = discoveryUri.AbsolutePath;

        if (path.EndsWith(OidcWellKnownSuffix, StringComparison.OrdinalIgnoreCase))
            path = path[..^OidcWellKnownSuffix.Length];

        if (path.Length == 0)
            path = "/";

        // The tenant query routes the fetch. It is not part of the issuer identifier.
        string raw = $"{discoveryUri.GetLeftPart(UriPartial.Authority)}{path}";

        return IdentityProviderUriValidator.TryGetCanonicalAbsoluteHttpOrHttps(raw, out expectedIssuer);
    }

    private static string NormalizeIssuerForComparison(string canonicalUri)
    {
        Uri parsed = new(canonicalUri);
        string path = parsed.AbsolutePath.TrimEnd('/');

        if (path.Length == 0)
            path = "/";

        string port = parsed.IsDefaultPort ? string.Empty : $":{parsed.Port}";

        return $"{parsed.Scheme}://{parsed.IdnHost}{port}{path}{parsed.Query}";
    }

    private static string DescribeOidcIssuerOutcome(string? issuer, bool issuerIsHttp, bool issuerMatchesMetadata)
    {
        if (issuerMatchesMetadata)
            return "OpenID configuration fetched successfully.";

        if (string.IsNullOrWhiteSpace(issuer))
            return "OpenID configuration fetched but issuer was missing.";

        if (!issuerIsHttp)
            return "OpenID configuration fetched but issuer was missing or not a valid HTTP(S) URL.";

        return "OpenID configuration issuer does not match the metadata URL.";
    }

    private static IReadOnlyList<string> ReadOidcAvailableClaimNames(JsonElement root)
    {
        List<string> names = [.. DefaultOidcClaimNames];

        if (!root.TryGetProperty("claims_supported", out JsonElement claims)
            || claims.ValueKind != JsonValueKind.Array)
        {
            return names;
        }

        foreach (JsonElement claim in claims.EnumerateArray())
        {

            if (names.Count >= MaxOidcAvailableClaimNames)
                break;

            if (claim.ValueKind != JsonValueKind.String)
                continue;

            string trimmed = claim.GetString()?.Trim() ?? string.Empty;

            if (!IdentityProviderSubstantiveTextValidation.HasSubstantiveText(trimmed))
                continue;

            if (names.Contains(trimmed, StringComparer.OrdinalIgnoreCase))
                continue;

            names.Add(trimmed);
        }

        return names;
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
