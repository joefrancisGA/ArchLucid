using System.Security.Cryptography;

using ArchLucid.Core.Codecs;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;

namespace ArchLucid.Application.Scim.Tokens;

public sealed class ScimBearerTokenAuthenticator(IScimTenantTokenRepository tokens) : IScimBearerTokenAuthenticator
{
    private readonly IScimTenantTokenRepository _tokens = tokens ?? throw new ArgumentNullException(nameof(tokens));

    /// <inheritdoc/>
    public async Task<ScimBearerAuthenticationResult?> TryAuthenticateAsync(string plaintextToken, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(plaintextToken);
        if (string.IsNullOrWhiteSpace(plaintextToken))
            return null;
        if (!TryParseToken(plaintextToken.Trim(), out string publicKey, out byte[]? secretBytes))
            return null;
        ScimTokenRow? row = await _tokens.FindActiveByPublicLookupKeyAsync(publicKey, cancellationToken);
        if (row is null)
        {
            if (secretBytes is not null)
                CryptographicOperations.ZeroMemory(secretBytes);
            return null;
        }

        bool ok = ScimArgonSecretHasher.VerifySecret(secretBytes!, row.TenantId, row.SecretHash);
        CryptographicOperations.ZeroMemory(secretBytes!);
        return !ok ? null : new ScimBearerAuthenticationResult { TenantId = row.TenantId, TokenRowId = row.Id };
    }

    private static bool TryParseToken(string token, out string publicKey, out byte[]? secretBytes)
    {
        publicKey = string.Empty;
        secretBytes = null;
        const string prefix = "archlucid_scim.";
        if (!token.StartsWith(prefix, StringComparison.Ordinal))
            return false;
        ReadOnlySpan<char> rest = token.AsSpan(prefix.Length);
        int dot = rest.IndexOf('.');
        if (dot <= 0 || dot == rest.Length - 1)
            return false;
        ReadOnlySpan<char> pub = rest[..dot];
        ReadOnlySpan<char> sec = rest[(dot + 1)..];
        if (pub.IsEmpty || sec.IsEmpty)
            return false;
        publicKey = pub.ToString();
        try
        {
            if (!Base64UrlCodec.TryDecode(sec.ToString(), out byte[] decoded) || decoded.Length == 0)
                return false;

            secretBytes = decoded;
            return true;
        }
        catch
        {
            return false;
        }
    }
}
