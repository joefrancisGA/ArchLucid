using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.Stripe;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using Newtonsoft.Json.Linq;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class StripeBillingProviderWebhookTests
{
    [SkippableFact]
    public async Task HandleWebhookAsync_without_signature_rejected()
    {
        BillingOptions billing = new()
        {
            Provider = BillingProviderNames.Stripe,
            Stripe = new StripeBillingOptions { WebhookSigningSecret = "whsec_test" }
        };

        TestMonitor<BillingOptions> monitor = new(billing);
        Mock<IBillingLedger> ledger = new();
        Mock<ITenantRepository> tenants = new();
        Mock<IAuditService> audit = new();
        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        changePlan
            .Setup(h => h.HandleAsync(It.IsAny<Guid>(), It.IsAny<JsonElement>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(MarketplaceWebhookMutationOutcome.Applied);
        StripeBillingProvider sut = new(monitor, ledger.Object, activator, changePlan.Object);

        BillingWebhookHandleResult result = await sut.HandleWebhookAsync(
            new BillingWebhookInbound { RawBody = "{}", StripeSignatureHeader = null },
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorDetail.Should().NotBeNullOrWhiteSpace();
        ledger.Verify(
            static l => l.TryInsertWebhookEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task HandleWebhookAsync_checkout_session_completed_without_object_discriminator_still_activates()
    {
        byte[] signingKeyMaterial = new byte[32];
        Array.Fill(signingKeyMaterial, (byte)19);
        string signingSecret = "whsec_" + Convert.ToBase64String(signingKeyMaterial);

        Guid tenantId = Guid.Parse("a1c0c2b0-7a4e-4c1a-9f0e-111111111111");
        Guid workspaceId = Guid.Parse("b2d0d3c1-8b5f-5d2b-a0f1-222222222222");
        Guid projectId = Guid.Parse("c3e1e4d2-9c60-6e3c-b1f2-333333333333");

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
        ledger
            .Setup(l => l.MarkWebhookProcessedAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ledger
            .Setup(l => l.ChangePlanAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ledger
            .Setup(l => l.ActivateSubscriptionAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.MarkTrialConvertedAsync(It.IsAny<Guid>(), It.IsAny<TenantTier>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        changePlan
            .Setup(h => h.HandleAsync(It.IsAny<Guid>(), It.IsAny<JsonElement>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(MarketplaceWebhookMutationOutcome.Applied);

        StripeBillingProvider sut = new(monitor, ledger.Object, activator, changePlan.Object);

        // data.object intentionally omits Stripe's resource "object":"checkout.session" — StripeObjectConverter
        // leaves EventData.Object null; RawObject fallback must still produce a Session with metadata.
        // Include request:null: Stripe.net EventConverter assumes the request key exists (github.com/stripe/stripe-dotnet).
        JObject payload = new JObject
        {
            ["id"] = "evt_discriminator_test",
            ["type"] = "checkout.session.completed",
            ["api_version"] = "2025-08-27.basil",
            ["data"] = new JObject
            {
                ["object"] = new JObject
                {
                    ["id"] = "cs_test",
                    ["subscription"] = "sub_no_object_key",
                    ["metadata"] = new JObject
                    {
                        ["tenant_id"] = tenantId.ToString("D"),
                        ["workspace_id"] = workspaceId.ToString("D"),
                        ["project_id"] = projectId.ToString("D"),
                        ["tier"] = "Pro",
                        ["seats"] = "2",
                        ["workspaces"] = "1"
                    }
                }
            }
        };

        payload.Add("request", JValue.CreateNull());

        string json = payload.ToString(Newtonsoft.Json.Formatting.None);
        string signature = BuildStripeV1Signature(signingSecret, json);

        BillingWebhookHandleResult result = await sut.HandleWebhookAsync(
            new BillingWebhookInbound { RawBody = json, StripeSignatureHeader = signature },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        ledger.Verify(
            l => l.ActivateSubscriptionAsync(
                tenantId,
                workspaceId,
                projectId,
                BillingProviderNames.Stripe,
                "sub_no_object_key",
                nameof(TenantTier.Standard),
                2,
                1,
                json,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static string BuildStripeV1Signature(string whsecSecret, string payload)
    {
        if (!whsecSecret.StartsWith("whsec_", StringComparison.Ordinal))
            throw new ArgumentException("Expected whsec_ prefix.", nameof(whsecSecret));

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
        public T CurrentValue
        {
            get;
        } = value;

        public T Get(string? name)
        {
            return CurrentValue;
        }

        public IDisposable? OnChange(Action<T, string?> listener)
        {
            return null;
        }
    }
}
