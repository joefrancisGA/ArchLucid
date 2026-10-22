using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidSaml2PrimaryApiSchemeTests
{
    [Fact]
    public void ResolvePrimaryApiAuthenticationScheme_keeps_jwt_bearer_when_inline_pem_is_set()
    {
        // Container Apps set the public key inline. Development hosts still say DevelopmentBypass.
        // SAML coexistence must not put that host back on the bypass scheme.
        ArchLucidAuthOptions options = new()
        {
            Mode = "DevelopmentBypass",
            JwtSigningPublicKeyPem = "-----BEGIN PUBLIC KEY-----\nMIIB\n-----END PUBLIC KEY-----",
        };

        string scheme = ArchLucidSaml2ServiceExtensions.ResolvePrimaryApiAuthenticationScheme(options);

        scheme.Should().Be(JwtBearerDefaults.AuthenticationScheme);
    }

    [Fact]
    public void ResolvePrimaryApiAuthenticationScheme_keeps_jwt_bearer_when_inline_pem_overrides_api_key_mode()
    {
        ArchLucidAuthOptions options = new()
        {
            Mode = "ApiKey",
            JwtSigningPublicKeyPem = "-----BEGIN PUBLIC KEY-----\nMIIB\n-----END PUBLIC KEY-----",
        };

        string scheme = ArchLucidSaml2ServiceExtensions.ResolvePrimaryApiAuthenticationScheme(options);

        scheme.Should().Be(JwtBearerDefaults.AuthenticationScheme);
    }
}
