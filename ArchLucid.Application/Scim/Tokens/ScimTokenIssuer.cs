using System.Security.Cryptography;

using ArchLucid.Core.Codecs;
using ArchLucid.Core.Scim;

namespace ArchLucid.Application.Scim.Tokens;

public sealed class ScimTokenIssuer(IScimTenantTokenRepository tokens) : IScimTokenIssuer
{
    private readonly IScimTenantTokenRepository _tokens = tokens ?? throw new ArgumentNullException(nameof(tokens));

    /// <inheritdoc/>
    public async Task<ScimTokenIssueResult> IssueTokenAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("TenantId must be set.", nameof(tenantId));

        byte[] publicBytes = RandomNumberGenerator.GetBytes(24);
        byte[] secretBytes = RandomNumberGenerator.GetBytes(32);
        string publicKey = Base64UrlCodec.Encode(publicBytes);
        string secretPart = Base64UrlCodec.Encode(secretBytes);
        string plaintext = $"archlucid_scim.{publicKey}.{secretPart}";
        byte[] hash = ScimArgonSecretHasher.HashSecret(secretBytes, tenantId);
        Guid id = await _tokens.InsertAsync(tenantId, publicKey, hash, cancellationToken);
        CryptographicOperations.ZeroMemory(secretBytes);
        return new ScimTokenIssueResult { TokenId = id, PlaintextToken = plaintext, PublicLookupKey = publicKey };
    }
}
