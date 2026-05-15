using System.Security.Cryptography;
using System.Text;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class SlackInteractivityVerifierTests
{
    [Fact]
    public void Verify_accepts_valid_signature_within_replay_window()
    {
        const string signingSecret = "test-signing-secret";
        const string body = "{\"type\":\"block_actions\"}";
        long timestamp = 1_700_000_000;

        FakeTimeProvider fakeClock = new();
        fakeClock.SetUtcNow(DateTimeOffset.FromUnixTimeSeconds(timestamp));

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ChatOpsIncomingWebhooksOptions { SlackSigningSecret = signingSecret });

        SlackInteractivityVerifier sut = new(options.Object, fakeClock);

        string signature = ComputeSlackSignature(signingSecret, timestamp.ToString(), body);

        bool ok = sut.Verify(body, timestamp.ToString(), signature);

        ok.Should().BeTrue();
    }

    [Fact]
    public void Verify_rejects_when_body_timestamp_or_signature_empty()
    {
        FakeTimeProvider fakeClock = new();
        fakeClock.SetUtcNow(DateTimeOffset.FromUnixTimeSeconds(1_700_000_000));

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ChatOpsIncomingWebhooksOptions { SlackSigningSecret = "x" });

        SlackInteractivityVerifier sut = new(options.Object, fakeClock);

        sut.Verify("", "1", "v0=ab").Should().BeFalse();
        sut.Verify("b", "", "v0=ab").Should().BeFalse();
        sut.Verify("b", "1", "").Should().BeFalse();
    }

    [Fact]
    public void Verify_rejects_when_signing_secret_missing()
    {
        FakeTimeProvider fakeClock = new();
        fakeClock.SetUtcNow(DateTimeOffset.FromUnixTimeSeconds(1_700_000_000));

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ChatOpsIncomingWebhooksOptions { SlackSigningSecret = null });

        SlackInteractivityVerifier sut = new(options.Object, fakeClock);

        sut.Verify("body", "1", "v0=00").Should().BeFalse();
    }

    [Fact]
    public void Verify_rejects_bad_timestamp_or_stale_request()
    {
        const string signingSecret = "secret";
        const string body = "{}";
        long now = 1_700_000_000;

        FakeTimeProvider fakeClock = new();
        fakeClock.SetUtcNow(DateTimeOffset.FromUnixTimeSeconds(now));

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ChatOpsIncomingWebhooksOptions { SlackSigningSecret = signingSecret });

        SlackInteractivityVerifier sut = new(options.Object, fakeClock);

        sut.Verify(body, "not-a-number", "v0=00").Should().BeFalse();

        long stale = now - 400;
        string sig = ComputeSlackSignature(signingSecret, stale.ToString(), body);

        sut.Verify(body, stale.ToString(), sig).Should().BeFalse();
    }

    [Fact]
    public void Verify_rejects_signature_mismatch()
    {
        const string signingSecret = "secret";
        const string body = "{}";
        long ts = 1_700_000_000;

        FakeTimeProvider fakeClock = new();
        fakeClock.SetUtcNow(DateTimeOffset.FromUnixTimeSeconds(ts));

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ChatOpsIncomingWebhooksOptions { SlackSigningSecret = signingSecret });

        SlackInteractivityVerifier sut = new(options.Object, fakeClock);

        sut.Verify(body, ts.ToString(), "v0=deadbeef").Should().BeFalse();
    }

    [Fact]
    public void ctor_throws_when_options_or_clock_null()
    {
        FakeTimeProvider fakeClock = new();

        Action missingOptions = () => new SlackInteractivityVerifier(null!, fakeClock);

        missingOptions.Should().Throw<ArgumentNullException>().WithParameterName("optionsMonitor");

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> options = new();

        Action missingClock = () => new SlackInteractivityVerifier(options.Object, null!);

        missingClock.Should().Throw<ArgumentNullException>().WithParameterName("timeProvider");
    }

    private static string ComputeSlackSignature(string signingSecret, string timestamp, string rawBody)
    {
        string baseString = $"v0:{timestamp}:{rawBody}";
        byte[] keyBytes = Encoding.UTF8.GetBytes(signingSecret);
        byte[] messageBytes = Encoding.UTF8.GetBytes(baseString);
        byte[] hash = HMACSHA256.HashData(keyBytes, messageBytes);

        return $"v0={Convert.ToHexString(hash).ToLowerInvariant()}";
    }
}
