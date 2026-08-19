using Azure.Core;

namespace ArchLucid.Persistence.Tests.BlobStore;

/// <summary>Hands out a deterministic synthetic token so Azure.Storage clients can be constructed offline.</summary>
public sealed class StaticBearerTokenCredential : TokenCredential
{
    public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken) =>
        new("unit-test-static-token", DateTimeOffset.UtcNow.AddMinutes(90));

    public override ValueTask<AccessToken> GetTokenAsync(
        TokenRequestContext requestContext,
        CancellationToken cancellationToken) =>
        new(GetToken(requestContext, cancellationToken));
}
