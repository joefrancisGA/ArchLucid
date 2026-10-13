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
}
