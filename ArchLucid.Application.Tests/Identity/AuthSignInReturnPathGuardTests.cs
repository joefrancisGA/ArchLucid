using ArchLucid.Application.Identity;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class AuthSignInReturnPathGuardTests
{
    [Theory]
    [InlineData("/reviews/1")]
    [InlineData("/")]
    [InlineData("/onboarding?source=bootstrap")]
    public void TryNormalize_accepts_safe_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().Be(path);
    }

    [Theory]
    [InlineData("//evil.example")]
    [InlineData("/\\evil.example")]
    [InlineData("/redirect://evil.example")]
    [InlineData("https://evil.example/phish")]
    [InlineData("/path@evil")]
    [InlineData("reviews/1")]
    [InlineData("/%2f%2fevil.example")]
    [InlineData("/%09//evil.example")]
    [InlineData("/%00//evil.example")]
    public void TryNormalize_rejects_open_redirect_shapes(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }
}
