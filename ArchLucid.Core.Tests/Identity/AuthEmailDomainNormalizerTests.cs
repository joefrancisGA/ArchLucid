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
}
