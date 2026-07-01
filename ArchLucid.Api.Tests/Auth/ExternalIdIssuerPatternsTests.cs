using ArchLucid.Api.Auth.Services;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExternalIdIssuerPatternsTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("https://login.microsoftonline.com/common/v2.0/")]
    public void IsConsumerIdentityIssuer_rejects_non_ciam_issuers(string? issuer)
    {
        ExternalIdIssuerPatterns.IsConsumerIdentityIssuer(issuer).Should().BeFalse();
    }

    [Theory]
    [InlineData("https://contoso.ciamlogin.com/contoso.onmicrosoft.com/v2.0")]
    [InlineData("https://contoso.ciamlogin.com/contoso.onmicrosoft.com/v2.0/")]
    public void IsConsumerIdentityIssuer_accepts_entra_external_id_ciam_v2_issuer(string issuer)
    {
        ExternalIdIssuerPatterns.IsConsumerIdentityIssuer(issuer).Should().BeTrue();
    }

    [Fact]
    public void IsConsumerIdentityIssuer_trims_whitespace_before_match()
    {
        ExternalIdIssuerPatterns.IsConsumerIdentityIssuer(
                "  https://contoso.ciamlogin.com/contoso.onmicrosoft.com/v2.0  ")
            .Should()
            .BeTrue();
    }
}
