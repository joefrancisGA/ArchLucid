using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EmailBrandingUrlsTests
{
    [SkippableFact]
    public void TryBuildLogoImageUrl_returns_null_when_base_blank()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl(null);

        url.Should().BeNull();
    }

    [SkippableFact]
    public void TryBuildLogoImageUrl_trims_base_and_uses_default_png_path()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl("https://app.example/");

        url.Should().Be("https://app.example/logo/icon-192.png");
    }

    [SkippableFact]
    public void TryBuildLogoImageUrl_trims_leading_and_trailing_whitespace_on_base()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl("  https://app.example  ");

        url.Should().Be("https://app.example/logo/icon-192.png");
    }

    [SkippableFact]
    public void TryBuildLogoImageUrl_returns_null_when_base_is_scheme_only()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl("https://");

        url.Should().BeNull();
    }

    [SkippableFact]
    public void TryBuildLogoImageUrl_omits_user_info_from_operator_base_url()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl("https://user:secret@ops.example.test");

        url.Should().Be("https://ops.example.test/logo/icon-192.png");
    }

    [SkippableFact]
    public void TryNormalizeOperatorBaseAuthority_omits_user_info()
    {
        string? baseUrl = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority("https://user:secret@ops.example.test");

        baseUrl.Should().Be("https://ops.example.test");
    }

    [SkippableFact]
    public void SanitizeOperatorAbsoluteUrl_omits_user_info_and_preserves_path_and_query()
    {
        string url = EmailBrandingUrls.SanitizeOperatorAbsoluteUrl(
            "https://user:secret@ops.example.test/v1.0/notifications/exec-digest/unsubscribe?token=abc");

        url.Should().Be("https://ops.example.test/v1.0/notifications/exec-digest/unsubscribe?token=abc");
    }

    [SkippableFact]
    public void TryBuildLogoImageUrl_accepts_relative_path_without_leading_slash()
    {
        string? url = EmailBrandingUrls.TryBuildLogoImageUrl("https://app.example", "logo/x.png");

        url.Should().Be("https://app.example/logo/x.png");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_repairs_scheme_only_concat_run_detail_url_with_operator_authority()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https:/architecture/reviews/a1b2c3d4",
            "https://ops.example.test");

        url.Should().Be("https://ops.example.test/architecture/reviews/a1b2c3d4");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_returns_relative_path_when_scheme_only_concat_has_no_repair_authority()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https:/architecture/reviews/a1b2c3d4",
            "https://");

        url.Should().Be("/architecture/reviews/a1b2c3d4");
    }
}
