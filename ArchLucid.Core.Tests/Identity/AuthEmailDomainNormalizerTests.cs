using ArchLucid.Core.Identity;

namespace ArchLucid.Core.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class AuthEmailDomainNormalizerTests
{
    [Theory]
    [InlineData("Example.COM", "example.com")]
    [InlineData("user@Corp.Example", "corp.example")]
    public void TryNormalize_accepts_valid_domains(string input, string expected)
    {
        bool ok = AuthEmailDomainNormalizer.TryNormalize(input, out string normalized, out string display);

        Assert.True(ok);
        Assert.Equal(expected, normalized);
        Assert.Equal(expected, display);
    }

    [Theory]
    [InlineData("localhost")]
    [InlineData("not-a-domain")]
    [InlineData("sub..example.com")]
    [InlineData("user@sub..example.com")]
    [InlineData("bad-.example.com")]
    [InlineData("")]
    public void TryNormalize_rejects_invalid_domains(string input)
    {
        bool ok = AuthEmailDomainNormalizer.TryNormalize(input, out _, out _);

        Assert.False(ok);
    }

    [Fact]
    public void TryNormalize_extracts_domain_from_email_shaped_admin_input()
    {
        bool ok = AuthEmailDomainNormalizer.TryNormalize(
            "admin@host.contoso.com",
            out string normalized,
            out string display);

        Assert.True(ok);
        Assert.Equal("host.contoso.com", normalized);
        Assert.Equal("host.contoso.com", display);
    }

    [Fact]
    public void TryNormalize_uses_suffix_after_last_at_for_multi_at_malformed_input()
    {
        bool ok = AuthEmailDomainNormalizer.TryNormalize(
            "user@host@contoso.com",
            out string normalized,
            out string display);

        Assert.True(ok);
        Assert.Equal("contoso.com", normalized);
        Assert.Equal("contoso.com", display);
    }
}
