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
    public void TryValidateHttpsAbsoluteUri_returns_canonical_https_uri()
    {
        bool ok = ChatOpsWebhookAbsoluteUriValidator.TryValidateHttpsAbsoluteUri(
            " https://hooks.slack.com/services/X/Y/Z ",
            out string deliveryUri);

        ok.Should().BeTrue();
        deliveryUri.Should().Be("https://hooks.slack.com/services/X/Y/Z");
    }
}
