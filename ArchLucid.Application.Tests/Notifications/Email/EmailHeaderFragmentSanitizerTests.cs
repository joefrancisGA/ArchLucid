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
    public void Sanitize_collapses_paragraph_separator_and_next_line_to_spaces()
    {
        string sanitized = EmailHeaderFragmentSanitizer.Sanitize("tier\u2029suffix");

        sanitized.Should().Be("tier suffix");
        sanitized.Should().NotContain("\u2029");
    }
}
