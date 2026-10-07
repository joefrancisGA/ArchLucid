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
}
