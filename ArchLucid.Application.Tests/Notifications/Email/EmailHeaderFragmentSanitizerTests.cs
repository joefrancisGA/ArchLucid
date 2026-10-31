using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class EmailHeaderFragmentSanitizerTests
{
    [Fact]
    public void Sanitize_collapses_unicode_line_separators_to_spaces()
    {
        string sanitized = EmailHeaderFragmentSanitizer.Sanitize("W30\u2028Bcc: injected@evil.test");

        sanitized.Should().Be("W30 Bcc: injected@evil.test");
        sanitized.Should().NotContain("\u2028");
    }

    [Fact]
    public void Sanitize_collapses_vertical_tab_and_form_feed_to_spaces()
    {
        string sanitized = EmailHeaderFragmentSanitizer.Sanitize("Weekly\u000Bscan\ffollow");

        sanitized.Should().Be("Weekly scan follow");
        sanitized.Should().NotContain("\u000B");
        sanitized.Should().NotContain("\f");
    }
}
