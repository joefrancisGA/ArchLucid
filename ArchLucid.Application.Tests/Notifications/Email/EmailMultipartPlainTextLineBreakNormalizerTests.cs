using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class EmailMultipartPlainTextLineBreakNormalizerTests
{
    [Fact]
    public void NormalizeOptional_maps_unicode_line_separators_to_lf()
    {
        string? normalized = EmailMultipartPlainTextLineBreakNormalizer.NormalizeOptional(
            "### Approvals pending\u2028- item");

        normalized.Should().Be("### Approvals pending\n- item");
        normalized.Should().NotContain("\u2028");
    }

    [Fact]
    public void NormalizeOptional_maps_paragraph_separator_to_lf()
    {
        string? normalized = EmailMultipartPlainTextLineBreakNormalizer.NormalizeOptional("first\u2029second");

        normalized.Should().Be("first\nsecond");
    }

    [Fact]
    public void NormalizeOptional_maps_vertical_tab_and_form_feed_to_lf()
    {
        string? normalized = EmailMultipartPlainTextLineBreakNormalizer.NormalizeOptional(
            "## Summary\u000Bline\fnext");

        normalized.Should().Be("## Summary\nline\nnext");
        normalized.Should().NotContain("\u000B");
        normalized.Should().NotContain("\f");
    }
}
