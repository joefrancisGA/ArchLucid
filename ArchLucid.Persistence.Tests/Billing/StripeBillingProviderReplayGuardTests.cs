using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.Stripe;

using Microsoft.Extensions.Options;

using Moq;

using Stripe;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class StripeBillingProviderReplayGuardTests
{
    private const string StripeNetWebhookApiVersion = "2025-08-27.basil";

    [SkippableFact]
    public async Task HandleWebhookAsync_when_replay_guard_has_seen_event_returns_replay_rejected()
    {
        byte[] keyMaterial = new byte[32];
        Array.Fill(keyMaterial, (byte)9);
        string signingSecret = "whsec_" + Convert.ToBase64String(keyMaterial);

        BillingOptions billing = new()
        {
            Provider = BillingProviderNames.Stripe,
            Stripe = new StripeBillingOptions { WebhookSigningSecret = signingSecret }
        };

        TestMonitor<BillingOptions> monitor = new(billing);
        Mock<IBillingLedger> ledger = new();
        Mock<IBillingWebhookReplayGuard> replayGuard = new();
        replayGuard
            .Setup(g => g.HasSeenAsync(BillingProviderNames.Stripe, "evt_replay_guard", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITenantRepository> tenants = new();
        Mock<IAuditService> audit = new();
        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        StripeBillingProvider sut = StripeBillingProviderTestSupport.CreateSut(
            monitor,
            ledger,
            activator,
            changePlan,
            replayGuard);

        Event stripeEvent = new()
        {
            Id = "evt_replay_guard",
            Type = "ping",
            ApiVersion = StripeNetWebhookApiVersion,
        };

        string json = stripeEvent.ToJson();
        string signature = BuildStripeV1Signature(signingSecret, json);

        BillingWebhookHandleResult result = await sut.HandleWebhookAsync(
            new BillingWebhookInbound { RawBody = json, StripeSignatureHeader = signature },
            CancellationToken.None);

        result.IsReplayRejected.Should().BeTrue();
        result.Succeeded.Should().BeFalse();
        ledger.Verify(
            l => l.TryInsertWebhookEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static string BuildStripeV1Signature(string whsecSecret, string payload)
    {
        byte[] key = Encoding.UTF8.GetBytes(whsecSecret);
        long timestamp = TimeProvider.System.GetUtcNow().ToUnixTimeSeconds();
        string signedPayload = $"{timestamp}.{payload}";

        using HMACSHA256 hmac = new(key);
        byte[] mac = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        string hex = Convert.ToHexString(mac).ToLowerInvariant();

        return $"t={timestamp},v1={hex}";
    }

    private sealed class TestMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue { get; } = value;

        public T Get(string? name) => CurrentValue;

        public IDisposable? OnChange(Action<T, string?> listener) => null;
    }
}
