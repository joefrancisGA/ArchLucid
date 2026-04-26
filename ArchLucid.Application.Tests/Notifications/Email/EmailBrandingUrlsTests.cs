using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EmailBrandingUrlsTests
{
    [Fact]
    public void TryBuildLogoImageUrl_returns_null_when_base_blank()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl(null);

        url.Should().BeNull();
    }

    [Fact]
    public void TryBuildLogoImageUrl_trims_base_and_uses_default_png_path()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl("https://app.example/");

        url.Should().Be("https://app.example/logo/icon-192.png");
    }

    [Fact]
    public void TryBuildLogoImageUrl_accepts_relative_path_without_leading_slash()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl("https://app.example", "logo/x.png");

        url.Should().Be("https://app.example/logo/x.png");
    }
}
