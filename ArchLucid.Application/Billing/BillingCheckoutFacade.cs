using System.Text.Json;

using ArchLucid.Application.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Billing;

public sealed class BillingCheckoutFacade(
    IBillingProviderRegistry billingProviderRegistry,
    IBillingLedger billingLedger,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IMarketplaceWebhookConnectivityService marketplaceWebhookConnectivityService) : IBillingCheckoutFacade
{
    private readonly IBillingProviderRegistry _billingProviderRegistry = billingProviderRegistry ?? throw new ArgumentNullException(nameof(billingProviderRegistry));
    private readonly IBillingLedger _billingLedger = billingLedger ?? throw new ArgumentNullException(nameof(billingLedger));
    private readonly IScopeContextProvider _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IMarketplaceWebhookConnectivityService _marketplaceWebhookConnectivityService = marketplaceWebhookConnectivityService ?? throw new ArgumentNullException(nameof(marketplaceWebhookConnectivityService));

    public async Task<BillingCheckoutSessionResult> CreateCheckoutSessionAsync(BillingCheckoutPostBody body, string actorUserName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(body);
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        if (string.IsNullOrWhiteSpace(body.ReturnUrl) || string.IsNullOrWhiteSpace(body.CancelUrl))
        {
            IBillingProvider badReqProvider = _billingProviderRegistry.ResolveActiveProvider();
            ArchLucidInstrumentation.RecordBillingCheckout(badReqProvider.ProviderName, "unknown", "validation_failed");
            return new BillingCheckoutSessionResult { Outcome = BillingCheckoutValidationOutcome.RequestBodyRequired };
        }

        BillingCheckoutTier tier = ParseCheckoutTier(body.TargetTier);
        BillingSubscriptionSnapshot? existingSubscription = await _billingLedger.TryGetSubscriptionAsync(scope.TenantId, cancellationToken);

        if (existingSubscription is not null && BlocksNewCheckout(existingSubscription.Status))
        {
            IBillingProvider conflictProvider = _billingProviderRegistry.ResolveActiveProvider();
            ArchLucidInstrumentation.RecordBillingCheckout(conflictProvider.ProviderName, tier.ToString(), "conflict_active_subscription");
            return new BillingCheckoutSessionResult { Outcome = BillingCheckoutValidationOutcome.ActiveSubscriptionConflict };
        }

        IBillingProvider provider = _billingProviderRegistry.ResolveActiveProvider();
        await LogBillingAuditAsync(AuditEventTypes.BillingCheckoutInitiated, actorUserName, scope, JsonSerializer.Serialize(new { provider = provider.ProviderName, tier = tier.ToString() }), cancellationToken);
        try
        {
            BillingCheckoutResult result = await provider.CreateCheckoutSessionAsync(new BillingCheckoutRequest
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                TargetTier = tier,
                Seats = body.Seats ?? 0,
                Workspaces = body.Workspaces ?? 0,
                BillingEmail = body.BillingEmail,
                ReturnUrl = body.ReturnUrl.Trim(),
                CancelUrl = body.CancelUrl.Trim(),
            }, cancellationToken);
            ArchLucidInstrumentation.RecordBillingCheckout(provider.ProviderName, tier.ToString(), "session_created");
            await LogBillingAuditAsync(AuditEventTypes.BillingCheckoutCompleted, actorUserName, scope, JsonSerializer.Serialize(new { provider = provider.ProviderName, tier = tier.ToString(), providerSessionId = result.ProviderSessionId }), cancellationToken);
            return new BillingCheckoutSessionResult { Outcome = BillingCheckoutValidationOutcome.Success, Checkout = result };
        }
        catch (InvalidOperationException ex)
        {
            ArchLucidInstrumentation.RecordBillingCheckout(provider.ProviderName, tier.ToString(), "provider_error");
            return new BillingCheckoutSessionResult { Outcome = BillingCheckoutValidationOutcome.ProviderError, ErrorMessage = ex.Message };
        }
    }

    public async Task<BillingPortalSessionResult> CreatePortalSessionAsync(BillingPortalPostBody body, string actorUserName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(body);
        if (string.IsNullOrWhiteSpace(body.ReturnUrl))
            return new BillingPortalSessionResult { Outcome = BillingCheckoutValidationOutcome.RequestBodyRequired };
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IBillingProvider provider = _billingProviderRegistry.ResolveActiveProvider();
        await LogBillingAuditAsync(AuditEventTypes.BillingPortalInitiated, actorUserName, scope, JsonSerializer.Serialize(new { provider = provider.ProviderName }), cancellationToken);
        try
        {
            BillingPortalResult result = await provider.CreateBillingPortalSessionAsync(new BillingPortalRequest { TenantId = scope.TenantId, ReturnUrl = body.ReturnUrl.Trim() }, cancellationToken);
            await LogBillingAuditAsync(AuditEventTypes.BillingPortalCompleted, actorUserName, scope, JsonSerializer.Serialize(new { provider = provider.ProviderName, providerSessionId = result.ProviderSessionId }), cancellationToken);
            return new BillingPortalSessionResult { Outcome = BillingCheckoutValidationOutcome.Success, Portal = result };
        }
        catch (InvalidOperationException ex)
        {
            return new BillingPortalSessionResult { Outcome = BillingCheckoutValidationOutcome.ProviderError, ErrorMessage = ex.Message };
        }
    }

    public async Task<BillingSubscriptionStatusQueryResult> GetSubscriptionStatusAsync(CancellationToken cancellationToken = default)
    {
        BillingSubscriptionSnapshot? snapshot = await _billingLedger.TryGetSubscriptionAsync(_scopeProvider.GetCurrentScope().TenantId, cancellationToken);
        if (snapshot is null) return new BillingSubscriptionStatusQueryResult { HasSubscription = false, IsPaymentPastDue = false };
        return new BillingSubscriptionStatusQueryResult { HasSubscription = true, Provider = snapshot.Provider, TierCode = snapshot.TierCode, Status = snapshot.Status, IsPaymentPastDue = string.Equals(snapshot.Status, "Suspended", StringComparison.OrdinalIgnoreCase) };
    }

    public async Task<MarketplaceWebhookTestResult> TestMarketplaceWebhookAsync(string actorUserName, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        OutboundWebhookDryRunResult outcome = await _marketplaceWebhookConnectivityService.TestConfiguredWebhookAsync(cancellationToken).ConfigureAwait(false);
        await _auditService.LogAsync(new AuditEvent
        {
            EventType = AuditEventTypes.OutboundWebhookDryRunProbeExecuted,
            ActorUserId = actorUserName,
            ActorUserName = actorUserName,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            DataJson = JsonSerializer.Serialize(new { probeKind = "billing_marketplace_webhook_configured", transportSucceeded = outcome.TransportSucceeded, statusCode = outcome.StatusCode, reasonPhrase = outcome.ReasonPhrase, error = outcome.Error }),
        }, cancellationToken);
        return new MarketplaceWebhookTestResult { Outcome = outcome };
    }

    private async Task LogBillingAuditAsync(string eventType, string actorUserName, ScopeContext scope, string dataJson, CancellationToken cancellationToken) =>
        await _auditService.LogAsync(new AuditEvent { EventType = eventType, ActorUserId = actorUserName, ActorUserName = actorUserName, TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId, DataJson = dataJson }, cancellationToken);

    private static BillingCheckoutTier ParseCheckoutTier(string? label) => string.IsNullOrWhiteSpace(label) ? BillingCheckoutTier.Team : label.Trim() switch
    {
        "Architect" => BillingCheckoutTier.Architect,
        "Pro" => BillingCheckoutTier.Pro,
        "Enterprise" => BillingCheckoutTier.Enterprise,
        _ => BillingCheckoutTier.Team,
    };

    private static bool BlocksNewCheckout(string status) =>
        string.Equals(status, "Active", StringComparison.OrdinalIgnoreCase)
        || string.Equals(status, "Suspended", StringComparison.OrdinalIgnoreCase);
}
