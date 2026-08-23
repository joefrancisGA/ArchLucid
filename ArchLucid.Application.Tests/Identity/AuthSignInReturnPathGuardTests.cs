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
    [InlineData("/architecture/first-review-guide?source=bootstrap")]
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
    [InlineData("/%2525252f%2525252fevil.example")]
    [InlineData("/%09//evil.example")]
    [InlineData("/%00//evil.example")]
    [InlineData("/x//evil.example")]
    [InlineData("/x%2F%2Fevil.example")]
    public void TryNormalize_rejects_open_redirect_shapes(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_deeply_encoded_embedded_protocol_relative_segment()
    {
        string payload = "//evil.example";

        for (int pass = 0; pass < 4; pass++)
        {
            payload = Uri.EscapeDataString(payload);
        }

        AuthSignInReturnPathGuard.TryNormalize($"/welcome{payload}").Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_residual_double_encoded_slashes_after_decode_cap()
    {
        string payload = "//evil.example";

        for (int pass = 0; pass < 10; pass++)
        {
            payload = Uri.EscapeDataString(payload);
        }

        AuthSignInReturnPathGuard.TryNormalize($"/welcome{payload}").Should().BeNull();
    }

    [Theory]
    [InlineData("/\uFF0F\uFF0Fevil.example")]
    [InlineData("/%EF%BC%8F%EF%BC%8Fevil.example")]
    [InlineData("/\uFF3C\uFF3Cevil.example")]
    public void TryNormalize_rejects_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u2571\u2571evil.example")]
    [InlineData("/%E2%95%B1%E2%95%B1evil.example")]
    [InlineData("/\u29F8\u29F8evil.example")]
    [InlineData("/%E2%A7%B8%E2%A7%B8evil.example")]
    [InlineData("/\u29F6\u29F6evil.example")]
    public void TryNormalize_rejects_additional_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_deeply_encoded_additional_unicode_slash_homoglyph_segment()
    {
        string payload = "\u29F8\u29F8evil.example";

        for (int pass = 0; pass < 4; pass++)
        {
            payload = Uri.EscapeDataString(payload);
        }

        AuthSignInReturnPathGuard.TryNormalize($"/welcome{payload}").Should().BeNull();
    }
}
