using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>HTTP mapping for replayed Marketplace webhook deliveries (must acknowledge with 2xx).</summary>
[Collection("ArchLucidEnvMutation")]
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class BillingMarketplaceWebhookReplayHttpTests
{
    [SkippableFact]
    public async Task Duplicate_marketplace_delivery_returns_ok_without_reprocessing()
    {
        BillingMarketplaceWebhookDeferredApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Guid tenantId = Guid.NewGuid();

        await BillingMarketplaceWebhookTestSeed.SeedTenantWithActiveBillingAsync(factory.SqlConnectionString, tenantId);

        string body =
            "{\"action\":\"ChangePlan\",\"subscriptionId\":\"sub-replay-http\",\"planId\":\"contoso-enterprise\",\"quantity\":5,\"purchaser\":{\"tenantId\":\""
            + tenantId.ToString("D", CultureInfo.InvariantCulture)
            + "\"}}";

        using HttpRequestMessage first = new(HttpMethod.Post, "/v1/billing/webhooks/marketplace");
        first.Content = new StringContent(body, Encoding.UTF8, "application/json");
        first.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-bearer");

        using HttpResponseMessage firstResponse = await client.SendAsync(first);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.Accepted);

        using HttpRequestMessage second = new(HttpMethod.Post, "/v1/billing/webhooks/marketplace");
        second.Content = new StringContent(body, Encoding.UTF8, "application/json");
        second.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-bearer");

        using HttpResponseMessage secondResponse = await client.SendAsync(second);

        secondResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
