using FluentAssertions;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class ChatOpsWebhookAbsoluteUriValidatorTests
{
    [Fact]
    public void TryValidateHttpsAbsoluteUri_rejects_embedded_line_breaks()
    {
        bool ok = ChatOpsWebhookAbsoluteUriValidator.TryValidateHttpsAbsoluteUri(
            "https://hooks.slack.com/services/X/Y/Z\r\nHost: evil.test",
            out string deliveryUri);

        ok.Should().BeFalse();
        deliveryUri.Should().BeEmpty();
    }

    [Fact]
    public void ResolveHttpsDeliveryUriOrThrow_rejects_embedded_line_breaks()
    {
        Action act = () => ChatOpsWebhookAbsoluteUriValidator.ResolveHttpsDeliveryUriOrThrow(
            "https://hooks.slack.com/x\r\nHost: evil.test",
            "destination");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void TryValidateHttpsAbsoluteUri_returns_canonical_https_uri()
    {
        bool ok = ChatOpsWebhookAbsoluteUriValidator.TryValidateHttpsAbsoluteUri(
            " https://hooks.slack.com/services/X/Y/Z ",
            out string deliveryUri);

        ok.Should().BeTrue();
        deliveryUri.Should().Be("https://hooks.slack.com/services/X/Y/Z");
    }

    [Fact]
    public void TryValidateHttpsAbsoluteUri_rejects_percent_encoded_line_breaks_in_path()
    {
        bool ok = ChatOpsWebhookAbsoluteUriValidator.TryValidateHttpsAbsoluteUri(
            "https://hooks.slack.com/services/X/Y/Z%0D%0AHost:%20evil.test",
            out string deliveryUri);

        ok.Should().BeFalse("percent-encoded CR/LF must not reach outbound webhook POST destinations");
        deliveryUri.Should().BeEmpty();
    }

    [Fact]
    public void TryValidateHttpsAbsoluteUri_rejects_unicode_line_separator_in_path()
    {
        bool ok = ChatOpsWebhookAbsoluteUriValidator.TryValidateHttpsAbsoluteUri(
            "https://hooks.slack.com/services/X/Y/Z\u2028Host: evil.test",
            out string deliveryUri);

        ok.Should().BeFalse("Unicode line separators must not reach outbound webhook POST destinations");
        deliveryUri.Should().BeEmpty();
    }

    [Fact]
    public void TryValidateHttpsAbsoluteUri_rejects_percent_encoded_unicode_line_separator_in_path()
    {
        bool ok = ChatOpsWebhookAbsoluteUriValidator.TryValidateHttpsAbsoluteUri(
            "https://hooks.slack.com/services/X/Y/Z%E2%80%A8Host:%20evil.test",
            out string deliveryUri);

        ok.Should().BeFalse("percent-encoded Unicode line separators must not reach outbound webhook POST destinations");
        deliveryUri.Should().BeEmpty();
    }
}
