using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Persistence.Billing.AzureMarketplace;

/// <summary>Admits at most one automatic activation dispatch per subscription in a billing ledger.</summary>
internal static class MarketplaceFulfillmentActivation
{
    private const string ApiSuffix = "?api-version=2018-08-31";
    private const string ProviderEndpoint = "https://marketplaceapi.microsoft.com/api/saas/subscriptions/";
    private const string ActivationClaimType = "MarketplaceActivationDispatchClaim";

    internal static async Task EnsureAsync(
        IHttpClientFactory clientFactory,
        IBillingLedger ledger,
        Guid subscriptionId,
        string bearerToken,
        CancellationToken cancellationToken)
    {
        using HttpClient reads = clientFactory.CreateClient(AzureMarketplaceBillingProvider.ActivationStatusHttpClientName);
        string subscriptionEndpoint = ProviderEndpoint + subscriptionId.ToString("D");
        string state = await ReadStatusAsync(reads, subscriptionEndpoint, subscriptionId, bearerToken, cancellationToken);

        if (IsSubscribed(state))
            return;

        if (!string.Equals(state, "PendingFulfillmentStart", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Marketplace subscription is not eligible for activation.");

        // A separate stable key in the canonical billing ledger survives different webhook payloads and worker restarts.
        // The unique insert is admission to send, not evidence of delivery. Never release it on an unknown outcome.
        bool admitted = await ledger.TryInsertWebhookEventAsync(
            "marketplace-activation:v1:" + subscriptionId.ToString("D"),
            BillingProviderNames.AzureMarketplace,
            ActivationClaimType,
            "{}",
            cancellationToken);

        if (!admitted)
            throw new InvalidOperationException(
                "Marketplace activation has already been attempted and is not yet confirmed. No activation was resent.");

        using HttpClient writes = clientFactory.CreateClient(nameof(AzureMarketplaceBillingProvider));
        using HttpRequestMessage request = new(HttpMethod.Post, subscriptionEndpoint + "/activate" + ApiSuffix);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        HttpResponseMessage response;

        try
        {
            response = await writes.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (HttpRequestException)
        {
            await ConfirmAfterUncertainSendAsync(reads, subscriptionEndpoint, subscriptionId, bearerToken, cancellationToken);

            return;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            await ConfirmAfterUncertainSendAsync(reads, subscriptionEndpoint, subscriptionId, bearerToken, cancellationToken);

            return;
        }

        using (response)
        {
            if (response.IsSuccessStatusCode)
                return; // Preserve normal handling of an accepted activation request.

            if (!IsUncertainStatus(response.StatusCode))
                throw new HttpRequestException(
                    $"Marketplace rejected activation with HTTP {(int)response.StatusCode}.",
                    inner: null, response.StatusCode);
        }

        await ConfirmAfterUncertainSendAsync(reads, subscriptionEndpoint, subscriptionId, bearerToken, cancellationToken);
    }

    private static async Task ConfirmAfterUncertainSendAsync(
        HttpClient client, string endpoint, Guid subscriptionId, string token, CancellationToken cancellationToken)
    {
        string state = await ReadStatusAsync(client, endpoint, subscriptionId, token, cancellationToken);

        if (!IsSubscribed(state))
            throw new InvalidOperationException(
                "Marketplace activation is not yet confirmed. A pending status does not prove that the first request failed.");
    }

    private static async Task<string> ReadStatusAsync(
        HttpClient client, string endpoint, Guid subscriptionId, string token, CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = new(HttpMethod.Get, endpoint + ApiSuffix);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using Stream payload = await response.Content.ReadAsStreamAsync(cancellationToken);
        using JsonDocument document = await JsonDocument.ParseAsync(payload, cancellationToken: cancellationToken);

        if (document.RootElement.ValueKind != JsonValueKind.Object
            || !document.RootElement.TryGetProperty("id", out JsonElement id)
            || id.ValueKind != JsonValueKind.String
            || !Guid.TryParse(id.GetString(), out Guid returnedSubscription)
            || returnedSubscription != subscriptionId
            || !document.RootElement.TryGetProperty("saasSubscriptionStatus", out JsonElement status)
            || status.ValueKind != JsonValueKind.String
            || string.IsNullOrWhiteSpace(status.GetString()))
            throw new InvalidOperationException("Marketplace did not return a valid state for the requested subscription.");

        return status.GetString()!.Trim();
    }

    private static bool IsSubscribed(string state) =>
        string.Equals(state, "Subscribed", StringComparison.OrdinalIgnoreCase);

    private static bool IsUncertainStatus(HttpStatusCode status) =>
        status is HttpStatusCode.RequestTimeout or HttpStatusCode.Conflict or HttpStatusCode.TooManyRequests
        || (int)status >= 500;
}
