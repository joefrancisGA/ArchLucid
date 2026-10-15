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

    [SkippableFact]
    public void SanitizeOperatorAbsoluteUrl_omits_embedded_crlf_from_exec_digest_scanner_style_unsubscribe_url()
    {
        string operatorBase = "https://ops.example.test\r\nBcc: injected@evil.test";
        string token = "abc";
        string raw = $"{operatorBase.Trim().TrimEnd('/')}/v1.0/notifications/exec-digest/unsubscribe?token={Uri.EscapeDataString(token)}";

        string sanitized = EmailBrandingUrls.SanitizeOperatorAbsoluteUrl(raw);

        sanitized.Should().NotContain("\r");
        sanitized.Should().NotContain("\n");
        sanitized.Should().Be("https://ops.example.test/v1.0/notifications/exec-digest/unsubscribe?token=abc");
    }

    [SkippableFact]
    public void TryNormalizeOperatorBaseAuthority_ignores_lines_after_embedded_crlf_in_operator_base()
    {
        string? authority = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority(
            "https://ops.example.test\r\nBcc: injected@evil.test");

        authority.Should().Be("https://ops.example.test");
    }

    [SkippableFact]
    public void TryNormalizeOperatorBaseAuthority_ignores_content_after_unicode_line_separator_in_operator_base()
    {
        string? authority = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority(
            "https://ops.example.test\u2028https://evil.test");

        authority.Should().Be("https://ops.example.test");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_repairs_malformed_run_detail_when_operator_base_has_embedded_crlf()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https:/architecture/reviews/a1b2c3d4",
            "https://ops.example.test\r\nBcc: injected@evil.test");

        url.Should().Be("https://ops.example.test/architecture/reviews/a1b2c3d4");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_omits_embedded_crlf_from_absolute_run_detail_url()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https://ops.example.test/architecture/reviews/a1b2c3d4\r\nBcc: injected@evil.test",
            "https://ops.example.test");

        url.Should().Be("https://ops.example.test/architecture/reviews/a1b2c3d4");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_repairs_malformed_run_detail_when_operator_base_is_padded_and_has_embedded_crlf()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https:/architecture/reviews/a1b2c3d4",
            "  https://ops.example.test\r\nBcc: injected@evil.test  ");

        url.Should().Be("https://ops.example.test/architecture/reviews/a1b2c3d4");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_omits_percent_encoded_crlf_from_absolute_run_detail_path()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https://ops.example.test/architecture/reviews/a1b2c3d4%0D%0ABcc%3A%20injected%40evil.test",
            "https://ops.example.test");

        url.Should().NotContain("%0D", "percent-encoded CR must not survive operator navigable URL sanitization");
        url.Should().NotContain("%0A", "percent-encoded LF must not survive operator navigable URL sanitization");

        Uri absolute = new(url);
        Uri.UnescapeDataString(absolute.AbsolutePath)
            .Should()
            .Be("/architecture/reviews/a1b2c3d4 Bcc: injected@evil.test");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_omits_literal_unicode_line_separator_from_absolute_run_detail_path()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https://ops.example.test/architecture/reviews/a1b2c3d4\u2028Bcc: injected@evil.test",
            "https://ops.example.test");

        url.Should().NotContain("\u2028");
        url.Should().NotContain("Bcc", "smuggled path suffix after a line separator must be dropped");

        Uri absolute = new(url);
        Uri.UnescapeDataString(absolute.AbsolutePath).Should().Be("/architecture/reviews/a1b2c3d4");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_omits_percent_encoded_unicode_line_separator_from_absolute_run_detail_path()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https://ops.example.test/architecture/reviews/a1b2c3d4%E2%80%A8Bcc%3A%20injected%40evil.test",
            "https://ops.example.test");

        url.Should().NotContain("%E2%80%A8", "percent-encoded line separator must not survive operator navigable URL sanitization");

        Uri absolute = new(url);
        Uri.UnescapeDataString(absolute.AbsolutePath)
            .Should()
            .Be("/architecture/reviews/a1b2c3d4 Bcc: injected@evil.test");
        Uri.UnescapeDataString(absolute.AbsolutePath).Should().NotContain("\u2028");
    }

    [SkippableFact]
    public void SanitizeOperatorNavigableUrl_omits_percent_encoded_unicode_line_separator_from_query_string_only()
    {
        string url = EmailBrandingUrls.SanitizeOperatorNavigableUrl(
            "https://ops.example.test/architecture/reviews/run?token=abc%E2%80%A8Bcc%3A%20injected%40evil.test",
            "https://ops.example.test");

        url.Should().NotContain("%E2%80%A8", "percent-encoded line separator must not survive query sanitization");

        Uri absolute = new(url);
        string query = Uri.UnescapeDataString(absolute.Query);

        query.Should().Contain("token=abc Bcc: injected@evil.test");
        query.Should().NotContain("\u2028");
    }
}
