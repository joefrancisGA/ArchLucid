using ArchLucid.Persistence.Billing;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class BillingMarketplaceWebhookDedupeKeyTests
{
    [Fact]
    public void Build_embeds_raw_action_without_trim_so_whitespace_variants_differ()
    {
        const string subscriptionId = "sub-1";
        const string bodySuspend = """{"action":"Suspend","subscriptionId":"sub-1"}""";
        const string bodySuspendPadded = """{"action":" Suspend ","subscriptionId":"sub-1"}""";

        string keyTrimmed = BillingMarketplaceWebhookDedupeKey.Build(subscriptionId, "Suspend", bodySuspend);
        string keyPaddedAction = BillingMarketplaceWebhookDedupeKey.Build(subscriptionId, " Suspend ", bodySuspendPadded);

        keyTrimmed.Should().NotBe(keyPaddedAction);
    }

    [Fact]
    public void Build_embeds_subscription_id_without_trim_so_whitespace_variants_differ()
    {
        const string body = """{"action":"Suspend","subscriptionId":"sub-1"}""";

        string keyTrimmed = BillingMarketplaceWebhookDedupeKey.Build("sub-1", "Suspend", body);
        string keyPaddedSubscription = BillingMarketplaceWebhookDedupeKey.Build(" sub-1 ", "Suspend", body);

        keyTrimmed.Should().NotBe(keyPaddedSubscription);
    }

    [Fact]
    public void Build_fingerprint_changes_when_raw_json_whitespace_outside_action_differs()
    {
        const string subscriptionId = "sub-1";
        const string compactBody = """{"action":"Suspend","subscriptionId":"sub-1"}""";
        const string spacedBody = """
            {
              "action": "Suspend",
              "subscriptionId": "sub-1"
            }
            """;

        string compactKey = BillingMarketplaceWebhookDedupeKey.Build(subscriptionId, "Suspend", compactBody);
        string spacedKey = BillingMarketplaceWebhookDedupeKey.Build(subscriptionId, "Suspend", spacedBody);

        compactKey.Should().NotBe(spacedKey);
    }

    [Fact]
    public void Build_uses_action_argument_verbatim_even_when_json_body_action_differs()
    {
        const string body = """{"action":"Renew","subscriptionId":"sub-1"}""";

        string suspendKey = BillingMarketplaceWebhookDedupeKey.Build("sub-1", "Suspend", body);
        string renewKey = BillingMarketplaceWebhookDedupeKey.Build("sub-1", "Renew", body);

        suspendKey.Should().StartWith("sub-1|Suspend|");
        renewKey.Should().StartWith("sub-1|Renew|");
        suspendKey.Should().NotBe(renewKey);
    }
}
