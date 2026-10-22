using ArchLucid.Application.Scim.Tokens;
using ArchLucid.Core.Scim;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Scim;

[Trait("Category", "Unit")]
public sealed class ScimBearerTokenAuthenticatorTests
{
    [Fact]
    public async Task TryAuthenticateAsync_returns_null_when_secret_segment_contains_interior_whitespace()
    {
        Mock<IScimTenantTokenRepository> tokens = new();
        ScimBearerTokenAuthenticator sut = new(tokens.Object);

        ScimBearerAuthenticationResult? result = await sut.TryAuthenticateAsync(
            "archlucid_scim.lookup-key.dGVz dGE=",
            CancellationToken.None);

        result.Should().BeNull("interior whitespace must not authenticate as a valid SCIM bearer secret.");
    }

    [Fact]
    public async Task TryAuthenticateAsync_returns_null_when_public_lookup_key_contains_interior_whitespace()
    {
        Mock<IScimTenantTokenRepository> tokens = new();
        ScimBearerTokenAuthenticator sut = new(tokens.Object);

        ScimBearerAuthenticationResult? result = await sut.TryAuthenticateAsync(
            "archlucid_scim.look up-key.dGVzdA==",
            CancellationToken.None);

        result.Should().BeNull("whitespace inside the lookup key segment is not a supported token shape.");
    }
}
