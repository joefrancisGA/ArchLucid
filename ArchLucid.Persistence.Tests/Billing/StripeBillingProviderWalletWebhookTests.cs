using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.Stripe;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using Stripe;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class StripeBillingProviderWalletWebhookTests
{
  [Fact]
  public async Task HandleWebhookAsync_wallet_payment_intent_missing_tenant_id_marks_failed_without_credit()
  {
    byte[] keyMaterial = new byte[32];
    Array.Fill(keyMaterial, (byte)11);
    string signingSecret = "whsec_" + Convert.ToBase64String(keyMaterial);

    BillingOptions billing = new()
    {
      Provider = BillingProviderNames.Stripe,
      Stripe = new StripeBillingOptions { WebhookSigningSecret = signingSecret }
    };

    TestMonitor<BillingOptions> monitor = new(billing);
    Mock<IBillingLedger> ledger = new();
    ledger
      .Setup(l => l.TryInsertWebhookEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
        It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(true);

    Mock<ITenantRepository> tenants = new();
    Mock<IAuditService> audit = new();
    BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
    Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
    StripeBillingSubscriptionWebhookProcessor subscriptionProcessor =
      new(ledger.Object, activator, changePlan.Object, audit.Object);

    Mock<ILlmTenantWalletStripeWebhookProcessor> walletProcessor = new();
    Mock<ILlmTenantWalletRepository> walletRepository = new();
    walletRepository
      .Setup(r => r.TryInsertStripeWebhookIdempotencyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(true);

    Mock<IBillingWebhookReplayGuard> replayGuard = new();
    replayGuard
      .Setup(g => g.HasSeenAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(false);

    StripeBillingProvider sut = new(
      monitor,
      ledger.Object,
      replayGuard.Object,
      subscriptionProcessor,
      walletProcessor.Object,
      walletRepository.Object);

    const string eventId = "evt_wallet_missing_tenant";
    PaymentIntent intent = new()
    {
        Id = "pi_missing_tenant",
        Amount = 1000,
        Metadata = new Dictionary<string, string> { { "purpose", "llm_wallet_refill" } },
    };

    Event stripeEvent = new()
    {
        Id = eventId,
        Type = "payment_intent.succeeded",
        ApiVersion = "2025-08-27.basil",
        Data = new EventData { Object = intent },
    };

    string json = stripeEvent.ToJson();

    string signature = BuildStripeV1Signature(signingSecret, json);

    Func<Task> act = () => sut.HandleWebhookAsync(
      new BillingWebhookInbound
      {
        RawBody = json,
        StripeSignatureHeader = signature,
        StripeWebhookRoute = StripeBillingWebhookRoute.Wallet
      },
      CancellationToken.None);

    await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*tenant_id*");

    walletProcessor.Verify(
      p => p.ProcessPaymentIntentEventAsync(
        It.IsAny<string>(),
        It.IsAny<string>(),
        It.IsAny<string?>(),
        It.IsAny<long>(),
        It.IsAny<string?>(),
        It.IsAny<Guid>(),
        It.IsAny<CancellationToken>()),
      Times.Never);

    ledger.Verify(
      l => l.MarkWebhookProcessedAsync(eventId, "Failed", It.IsAny<CancellationToken>()),
      Times.Once);
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

  private sealed class TestMonitor<T>(T value) : IOptionsMonitor<T>
    where T : class
  {
    public T CurrentValue => value;

    public T Get(string? name) => value;

    public IDisposable? OnChange(Action<T, string?> listener) => null;
  }
}
