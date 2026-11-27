using System.Text.Json;

using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Azure.Core;
using Azure.Identity;

namespace ArchLucid.Persistence.Billing.AzureMarketplace;

public sealed partial class AzureMarketplaceBillingProvider
{
    public async Task<BillingWebhookHandleResult> HandleWebhookAsync(
        BillingWebhookInbound inbound,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(inbound.MarketplaceAuthorizationBearer))
            return BillingWebhookHandleResult.Rejected("Missing Marketplace bearer token.");

        MarketplaceWebhookValidatedToken? validated =
            await _tokenVerifier.ValidateAsync(inbound.MarketplaceAuthorizationBearer, cancellationToken);

        if (validated is null)
            return BillingWebhookHandleResult.Rejected("Marketplace JWT validation failed.");

        JsonDocument doc;

        try
        {
            doc = JsonDocument.Parse(inbound.RawBody);
        }
        catch (JsonException)
        {
            return BillingWebhookHandleResult.Rejected("Marketplace webhook body is not valid JSON.");
        }

        using (doc)
        {
        JsonElement root = doc.RootElement;

        string action = root.TryGetProperty("action", out JsonElement actionEl)
            ? actionEl.GetString() ?? string.Empty
            : string.Empty;

        string subscriptionId = root.TryGetProperty("subscriptionId", out JsonElement subEl)
            ? subEl.GetString() ?? string.Empty
            : string.Empty;

        string dedupeKey = BillingMarketplaceWebhookDedupeKey.Build(subscriptionId, action, inbound.RawBody);

        if (await _webhookReplayGuard.HasSeenAsync(ProviderName, dedupeKey, cancellationToken).ConfigureAwait(false))
        {
            return BillingWebhookHandleResult.ReplayRejected(
                $"Marketplace webhook '{dedupeKey}' was already processed within the replay protection window.");
        }

        bool inserted = await _ledger.TryInsertWebhookEventAsync(
            dedupeKey,
            ProviderName,
            action,
            inbound.RawBody,
            cancellationToken);

        if (!inserted)
        {
            string? prior = await _ledger.GetWebhookEventResultStatusAsync(dedupeKey, cancellationToken);

            if (BillingWebhookLedgerReplayPolicy.ShouldRejectDuplicateLedgerEntry(prior))
                return BillingWebhookHandleResult.ReplayRejected(
                    $"Marketplace webhook '{dedupeKey}' was already processed.");
        }

        try
        {
            Guid tenantId = ResolveTenantId(root, validated);

            if (tenantId == Guid.Empty)
            {
                await _ledger.MarkWebhookProcessedAsync(dedupeKey, "IgnoredMissingTenant", cancellationToken);
                await _webhookReplayGuard.RememberAsync(ProviderName, dedupeKey, cancellationToken).ConfigureAwait(false);

                return BillingWebhookHandleResult.Ok();
            }

            Guid workspaceId = ReadGuid(root, "workspaceId", ScopeIds.DefaultWorkspace);
            Guid projectId = ReadGuid(root, "projectId", ScopeIds.DefaultProject);

            MarketplaceDispatchCompletion completion = await DispatchMarketplaceActionAsync(
                root,
                action,
                tenantId,
                workspaceId,
                projectId,
                subscriptionId,
                inbound.RawBody,
                cancellationToken);

            string webhookResultStatus = completion == MarketplaceDispatchCompletion.DeferredNoIntegration
                ? "AcknowledgedNoOp"
                : "Processed";

            await _ledger.MarkWebhookProcessedAsync(dedupeKey, webhookResultStatus, cancellationToken);
            await _webhookReplayGuard.RememberAsync(ProviderName, dedupeKey, cancellationToken).ConfigureAwait(false);

            if (completion == MarketplaceDispatchCompletion.DeferredNoIntegration)
                return BillingWebhookHandleResult.AcceptedDeferred();

            MarketplaceWebhookReceivedIntegrationPayload integrationPayload = new()
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                ProviderDedupeKey = dedupeKey,
                Action = action,
                SubscriptionId = subscriptionId,
                BillingProvider = ProviderName
            };

            return BillingWebhookHandleResult.Ok(integrationPayload);
        }
        catch (OperationCanceledException) when (
            cancellationToken.IsCancellationRequested
            && _billingOptions.CurrentValue.AzureMarketplace.FulfillmentApiEnabled
            && IsActivationAction(action))
        {
            // Allow a later delivery to reconcile the durable activation claim even if the caller disconnected.
            using CancellationTokenSource cleanup = new(TimeSpan.FromSeconds(5));
            await _ledger.MarkWebhookProcessedAsync(dedupeKey, "Failed", cleanup.Token);

            throw;
        }
        catch (Exception)
        {
            await _ledger.MarkWebhookProcessedAsync(dedupeKey, "Failed", cancellationToken);

            throw;
        }
        }
    }

    private async Task<MarketplaceDispatchCompletion> DispatchMarketplaceActionAsync(
        JsonElement root,
        string action,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string subscriptionId,
        string rawBody,
        CancellationToken cancellationToken)
    {
        string normalized = action.Trim();

        if (string.Equals(normalized, "Suspend", StringComparison.OrdinalIgnoreCase))
        {
            await _ledger.SuspendSubscriptionAsync(tenantId, cancellationToken);

            return MarketplaceDispatchCompletion.PublishIntegrationEnvelope;
        }

        if (string.Equals(normalized, "Reinstate", StringComparison.OrdinalIgnoreCase))
        {
            await _ledger.ReinstateSubscriptionAsync(tenantId, cancellationToken);

            return MarketplaceDispatchCompletion.PublishIntegrationEnvelope;
        }

        if (string.Equals(normalized, "Unsubscribe", StringComparison.OrdinalIgnoreCase))
        {
            await _ledger.CancelSubscriptionAsync(tenantId, cancellationToken);

            return MarketplaceDispatchCompletion.PublishIntegrationEnvelope;
        }

        if (string.Equals(normalized, "ChangePlan", StringComparison.OrdinalIgnoreCase))
        {
            MarketplaceWebhookMutationOutcome outcome =
                await _changePlanWebhookMutationHandler.HandleAsync(tenantId, root, rawBody, cancellationToken);

            return outcome == MarketplaceWebhookMutationOutcome.DeferredGaDisabled
                ? MarketplaceDispatchCompletion.DeferredNoIntegration
                : MarketplaceDispatchCompletion.PublishIntegrationEnvelope;
        }

        if (string.Equals(normalized, "ChangeQuantity", StringComparison.OrdinalIgnoreCase))
        {
            MarketplaceWebhookMutationOutcome outcome =
                await _changeQuantityWebhookMutationHandler.HandleAsync(tenantId, root, rawBody, cancellationToken);

            return outcome == MarketplaceWebhookMutationOutcome.DeferredGaDisabled
                ? MarketplaceDispatchCompletion.DeferredNoIntegration
                : MarketplaceDispatchCompletion.PublishIntegrationEnvelope;
        }

        if (!IsActivationAction(normalized))
            return MarketplaceDispatchCompletion.PublishIntegrationEnvelope;

        await ActivateIfRequestedAsync(
            tenantId,
            workspaceId,
            projectId,
            subscriptionId,
            rawBody,
            cancellationToken);

        return MarketplaceDispatchCompletion.PublishIntegrationEnvelope;
    }

    private static bool IsActivationAction(string action) =>
        string.Equals(action.Trim(), "Subscribe", StringComparison.OrdinalIgnoreCase)
        || string.Equals(action.Trim(), "Purchase", StringComparison.OrdinalIgnoreCase);

    private async Task ActivateIfRequestedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string subscriptionId,
        string rawBody,
        CancellationToken cancellationToken)
    {
        BillingOptions billing = _billingOptions.CurrentValue;

        if (billing.AzureMarketplace.FulfillmentApiEnabled)
        {
            if (!Guid.TryParse(subscriptionId, out Guid marketplaceSubscriptionId) || marketplaceSubscriptionId == Guid.Empty)
                throw new InvalidOperationException("Marketplace activation requires a valid subscription identifier.");

            TokenCredential credential = new DefaultAzureCredential();
            AccessToken token = await credential.GetTokenAsync(
                new TokenRequestContext(["https://marketplaceapi.microsoft.com/.default"]),
                cancellationToken);

            await MarketplaceFulfillmentActivation.EnsureAsync(
                _httpClientFactory, _ledger, marketplaceSubscriptionId, token.Token, cancellationToken);
        }

        BillingCheckoutTier tier = BillingCheckoutTier.Team;
        string tierCode = BillingTierCode.FromCheckoutTier(tier);

        await _trialActivator.OnSubscriptionActivatedAsync(
            tenantId,
            workspaceId,
            projectId,
            ProviderName,
            subscriptionId,
            tierCode,
            BillingTierCode.CheckoutTierLabel(tier),
            1,
            1,
            rawBody,
            cancellationToken);
    }

    private static Guid ReadGuid(JsonElement root, string name, Guid fallback)
    {
        if (!root.TryGetProperty(name, out JsonElement el))
            return fallback;

        string? s = el.GetString();

        return Guid.TryParse(s, out Guid g) ? g : fallback;
    }

    private Guid ResolveTenantId(JsonElement root, MarketplaceWebhookValidatedToken validatedToken)
    {
        BillingOptions billing = _billingOptions.CurrentValue;
        string? claimType = billing.AzureMarketplace.TenantIdClaimType?.Trim();

        if (!string.IsNullOrWhiteSpace(claimType))
        {
            string? fromClaim = validatedToken.FindFirstClaimValue(claimType);

            if (Guid.TryParse(fromClaim, out Guid tenantFromClaim))
                return tenantFromClaim;
        }

        if (!root.TryGetProperty("purchaser", out JsonElement purchaser) ||
            !purchaser.TryGetProperty("tenantId", out JsonElement tenantEl))
            return Guid.Empty;
        string? s = tenantEl.GetString();

        return Guid.TryParse(s, out Guid g) ? g : Guid.Empty;
    }

    private enum MarketplaceDispatchCompletion
    {
        PublishIntegrationEnvelope,
        DeferredNoIntegration
    }
}
