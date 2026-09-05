using System.Net;
using System.Text;

using FluentAssertions;

using Stripe;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>HTTP mapping for replayed Stripe webhook events (must acknowledge with 2xx).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class BillingStripeWebhookReplayHttpTests
{
    [SkippableFact]
    public async Task Duplicate_stripe_event_returns_ok_without_reprocessing()
    {
        await using StripeCheckoutEndToEndWebAppFactory factory = new();
        HttpClient client = factory.CreateClient();

        Event stripeEvent = new()
        {
            Id = "evt_http_replay_ping",
            Type = "ping",
            ApiVersion = StripeCheckoutE2EWebhookTestSigning.StripeNetWebhookApiVersion,
        };

        string json = stripeEvent.ToJson();
        string signature = StripeCheckoutE2EWebhookTestSigning.BuildStripeV1Signature(
            StripeCheckoutE2EWebhookTestSigning.WebhookSigningSecret,
            json);

        using HttpRequestMessage first = new(HttpMethod.Post, "/v1/billing/webhooks/stripe/subscriptions");
        first.Content = new StringContent(json, Encoding.UTF8, "application/json");
        first.Headers.TryAddWithoutValidation("Stripe-Signature", signature);

        using HttpResponseMessage firstResponse = await client.SendAsync(first);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using HttpRequestMessage second = new(HttpMethod.Post, "/v1/billing/webhooks/stripe/subscriptions");
        second.Content = new StringContent(json, Encoding.UTF8, "application/json");
        second.Headers.TryAddWithoutValidation("Stripe-Signature", signature);

        using HttpResponseMessage secondResponse = await client.SendAsync(second);

        secondResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [SkippableFact]
    public async Task Duplicate_stripe_signature_headers_use_first_non_empty_value()
    {
        await using StripeCheckoutEndToEndWebAppFactory factory = new();
        HttpClient client = factory.CreateClient();

        Event stripeEvent = new()
        {
            Id = "evt_http_replay_ping_dup_sig",
            Type = "ping",
            ApiVersion = StripeCheckoutE2EWebhookTestSigning.StripeNetWebhookApiVersion,
        };

        string json = stripeEvent.ToJson();
        string signature = StripeCheckoutE2EWebhookTestSigning.BuildStripeV1Signature(
            StripeCheckoutE2EWebhookTestSigning.WebhookSigningSecret,
            json);

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/billing/webhooks/stripe/subscriptions");
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        request.Headers.TryAddWithoutValidation("Stripe-Signature", " ");
        request.Headers.TryAddWithoutValidation("Stripe-Signature", signature);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
