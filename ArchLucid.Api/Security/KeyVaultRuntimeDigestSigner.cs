using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Azure.Core;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Security;

// Key Vault REST sign operation: version-pinned key, managed identity, no private key export.
// The transport is supplied by the host with automatic redirects disabled.
internal sealed class KeyVaultRuntimeDigestSigner(
    IConfiguration config, TokenCredential credential, HttpClient transport,
    IRuntimeAttestationPublicationAuthority authority, IRuntimeTelemetryTrustRegistry trust)
    : IScopedRuntimeDigestSigner
{
    public async Task<(string KeyId, byte[] Signature)?> SignSha256Async(
        RuntimeObservationRequest request, byte[] digest, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (digest is not { Length: 32 } || !await authority.CanPublishAsync(request, ct))
            return null;
        var section = RuntimeTelemetryProvisioning.Scope(config, request);
        string? keyId = section["Publication:KeyId"];
        string? configured = section["Publication:KeyVaultKeyUri"];
        if (string.IsNullOrWhiteSpace(keyId) || keyId.Length > 128 ||
            !keyId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.') ||
            !TryKeyUri(configured, out var keyUri)) return null;
        var hash = digest.ToArray();
        try
        {
            byte[]? publicKey = await trust.ReadCurrentKeyAsync(request, keyId, ct);
            if (publicKey is not { Length: > 0 and <= 512 }) return null;
            var token = await credential.GetTokenAsync(
                new TokenRequestContext(["https://vault.azure.net/.default"]), ct);
            using var message = new HttpRequestMessage(HttpMethod.Post,
                new Uri(keyUri!.AbsoluteUri + "/sign?api-version=7.4"));
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token.Token);
            message.Content = JsonContent.Create(new { alg = "ES256", value = Encode(hash) });
            using var response = await transport.SendAsync(message, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!response.IsSuccessStatusCode || response.Content.Headers.ContentLength is > 8192)
                return null;
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var buffer = new MemoryStream();
            byte[] chunk = new byte[1024];
            int count;
            while ((count = await stream.ReadAsync(chunk.AsMemory(), ct)) != 0)
            {
                if (buffer.Length + count > 8192) return null;
                buffer.Write(chunk, 0, count);
            }
            using var result = JsonDocument.Parse(buffer.ToArray());
            if (!result.RootElement.TryGetProperty("kid", out var kid) ||
                kid.ValueKind != JsonValueKind.String ||
                !string.Equals(kid.GetString(), keyUri.AbsoluteUri, StringComparison.Ordinal) ||
                !result.RootElement.TryGetProperty("value", out var value) ||
                value.ValueKind != JsonValueKind.String) return null;
            string? encoded = value.GetString();
            if (encoded is not { Length: 86 } ||
                !encoded.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_')) return null;
            var signature = Convert.FromBase64String(encoded.Replace('-', '+').Replace('_', '/') + "==");
            using var verifier = ECDsa.Create();
            verifier.ImportSubjectPublicKeyInfo(publicKey, out int consumed);
            if (consumed != publicKey.Length ||
                verifier.ExportParameters(false).Curve.Oid.Value != "1.2.840.10045.3.1.7" ||
                !verifier.VerifyHash(hash, signature, DSASignatureFormat.IeeeP1363FixedFieldConcatenation))
                return null;
            if (!await authority.CanPublishAsync(request, ct) ||
                !string.Equals(section["Publication:KeyId"], keyId, StringComparison.Ordinal) ||
                !string.Equals(section["Publication:KeyVaultKeyUri"], configured, StringComparison.Ordinal))
                return null;
            byte[]? currentKey = await trust.ReadCurrentKeyAsync(request, keyId, ct);
            ct.ThrowIfCancellationRequested();
            return currentKey is not null && CryptographicOperations.FixedTimeEquals(publicKey, currentKey)
                ? (keyId, signature) : null;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex) when (ex is HttpRequestException or IOException or JsonException
            or CryptographicException or FormatException or Azure.RequestFailedException
            or Azure.Identity.AuthenticationFailedException or OperationCanceledException)
        { return null; }
    }

    internal static bool TryKeyUri(string? value, out Uri? uri)
    {
        uri = null;
        if (!Uri.TryCreate(value, UriKind.Absolute, out var candidate) ||
            candidate.Scheme != Uri.UriSchemeHttps || !candidate.IsDefaultPort ||
            candidate.UserInfo.Length != 0 || candidate.Query.Length != 0 ||
            candidate.Fragment.Length != 0 || !candidate.Host.EndsWith(".vault.azure.net", StringComparison.OrdinalIgnoreCase))
            return false;
        var host = candidate.Host[..^".vault.azure.net".Length];
        if (host.Length is < 3 or > 24 || !host.All(c => char.IsAsciiLetterOrDigit(c) || c == '-'))
            return false;
        var parts = candidate.AbsolutePath.Split('/');
        if (parts.Length != 4 || parts[1] != "keys" || parts[2].Length is < 1 or > 127 ||
            !parts[2].All(c => char.IsAsciiLetterOrDigit(c) || c == '-') ||
            parts[3].Length != 32 || !parts[3].All(Uri.IsHexDigit)) return false;
        uri = candidate;
        return true;
    }

    private static string Encode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
