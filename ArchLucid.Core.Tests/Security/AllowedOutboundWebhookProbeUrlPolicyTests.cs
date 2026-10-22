using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
public sealed class AllowedOutboundWebhookProbeUrlPolicyTests
{
    [Theory]
    [InlineData("https://hooks.example.com/webhook")]
    [InlineData("https://example.com:8443/path?q=1")]
    public void TryGetRejectionReason_WhenPublicHttps_Allows(string rawUrl)
    {
        AllowedOutboundWebhookProbeUrlPolicy.TryGetRejectionReason(rawUrl).Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryGetRejectionReason_WhenEmpty_Rejects(string? rawUrl)
    {
        AllowedOutboundWebhookProbeUrlPolicy.TryGetRejectionReason(rawUrl).Should().Contain("required");
    }

    [Theory]
    [InlineData("https://user:pass@example.com/webhook", "embedded credentials")]
    [InlineData("https://token@example.com/webhook", "embedded credentials")]
    public void TryGetRejectionReason_WhenUrlEmbedsCredentials_Rejects(string rawUrl, string expectedPhrase)
    {
        string? reason = AllowedOutboundWebhookProbeUrlPolicy.TryGetRejectionReason(rawUrl);

        reason.Should().NotBeNull();
        reason.Should().Contain(expectedPhrase);
    }

    [Theory]
    [InlineData("not-a-url", "absolute HTTPS URL")]
    [InlineData("http://example.com/webhook", "https scheme")]
    [InlineData("https://localhost/webhook", "loopback")]
    [InlineData("https://127.0.0.1/webhook", "loopback")]
    [InlineData("https://10.0.0.5/webhook", "private")]
    public void TryGetRejectionReason_WhenUrlTargetsUnsafeAddress_Rejects(string rawUrl, string expectedPhrase)
    {
        string? reason = AllowedOutboundWebhookProbeUrlPolicy.TryGetRejectionReason(rawUrl);

        reason.Should().NotBeNull();
        reason.Should().Contain(expectedPhrase);
    }

    [Fact]
    public async Task TryGetRejectionReasonAfterDnsResolveAsync_WhenSyncGuardRejects_SkipsDnsLookup()
    {
        string? reason = await AllowedOutboundWebhookProbeUrlPolicy.TryGetRejectionReasonAfterDnsResolveAsync(
            "https://127.0.0.1/webhook");

        reason.Should().Contain("TargetUrl");
        reason.Should().Contain("private network");
    }
}
