using ArchLucid.Core.Security;

namespace ArchLucid.Core.Tests.Security;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AlertRoutingWebhookDestinationPolicyTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryGetRejectionReason_rejects_empty(string? rawUrl)
    {
        string? reason = AlertRoutingWebhookDestinationPolicy.TryGetRejectionReason(rawUrl);

        Assert.Equal("Webhook URL is required.", reason);
    }

    [Theory]
    [InlineData("http://example.com/hook")]
    [InlineData("ftp://example.com/hook")]
    public void TryGetRejectionReason_rejects_non_https(string rawUrl)
    {
        string? reason = AlertRoutingWebhookDestinationPolicy.TryGetRejectionReason(rawUrl);

        Assert.Equal("Webhook URL must use the https scheme.", reason);
    }

    [Theory]
    [InlineData("https://127.0.0.1/hook")]
    [InlineData("https://localhost/hook")]
    public void TryGetRejectionReason_rejects_private_targets(string rawUrl)
    {
        string? reason = AlertRoutingWebhookDestinationPolicy.TryGetRejectionReason(rawUrl);

        Assert.Equal(
            "Webhook URL must not target loopback, link-local, or private network addresses.",
            reason);
    }

    [Fact]
    public void TryGetRejectionReason_accepts_public_https()
    {
        string? reason = AlertRoutingWebhookDestinationPolicy.TryGetRejectionReason("https://listener.example/webhook");

        Assert.Null(reason);
    }
}
