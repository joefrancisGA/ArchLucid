using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Billing;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Billing;

/// <summary>Hosted checkout for trial conversion (provider selected via <c>Billing:Provider</c>).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/billing")]
public sealed class BillingCheckoutController(
    IBillingProviderRegistry billingProviderRegistry,
    IBillingLedger billingLedger,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IMarketplaceWebhookConnectivityService marketplaceWebhookConnectivityService) : ControllerBase
{
    private readonly IAuditService
        _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IBillingLedger _billingLedger =
        billingLedger ?? throw new ArgumentNullException(nameof(billingLedger));

    private readonly IBillingProviderRegistry _billingProviderRegistry =
        billingProviderRegistry ?? throw new ArgumentNullException(nameof(billingProviderRegistry));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IMarketplaceWebhookConnectivityService _marketplaceWebhookConnectivityService =
        marketplaceWebhookConnectivityService ?? throw new ArgumentNullException(nameof(marketplaceWebhookConnectivityService));

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("checkout")]
    [SkipTrialWriteLimit]
    [ProducesResponseType(typeof(BillingCheckoutResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckoutAsync(
        [FromBody] BillingCheckoutPostRequest? body,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (body is null ||
            string.IsNullOrWhiteSpace(body.ReturnUrl) ||
            string.IsNullOrWhiteSpace(body.CancelUrl))
        {
            IBillingProvider badReqProvider = _billingProviderRegistry.ResolveActiveProvider();
            ArchLucidInstrumentation.RecordBillingCheckout(badReqProvider.ProviderName, "unknown", "validation_failed");

            return this.BadRequestProblem(
                "ReturnUrl, CancelUrl, and TargetTier are required.",
                ProblemTypes.ValidationFailed);
        }

        BillingCheckoutTier tier = ParseCheckoutTier(body.TargetTier);

        BillingSubscriptionSnapshot? existingSubscription =
            await _billingLedger.TryGetSubscriptionAsync(scope.TenantId, cancellationToken);

        if (existingSubscription is not null &&
            !string.Equals(existingSubscription.Status, "Canceled", StringComparison.OrdinalIgnoreCase))
        {
            IBillingProvider conflictProvider = _billingProviderRegistry.ResolveActiveProvider();
            ArchLucidInstrumentation.RecordBillingCheckout(
                conflictProvider.ProviderName,
                tier.ToString(),
                "conflict_active_subscription");

            return this.ConflictProblem(
                "A billing subscription already exists for this tenant. Use Manage billing to update payment or cancel.",
                ProblemTypes.Conflict);
        }

        IBillingProvider providerForAudit = _billingProviderRegistry.ResolveActiveProvider();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.BillingCheckoutInitiated,
                ActorUserId = User.Identity?.Name ?? "admin",
                ActorUserName = User.Identity?.Name ?? "admin",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { provider = providerForAudit.ProviderName, tier = tier.ToString() })
            },
            cancellationToken);

        BillingCheckoutRequest request = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            TargetTier = tier,
            Seats = body.Seats,
            Workspaces = body.Workspaces,
            BillingEmail = body.BillingEmail,
            ReturnUrl = body.ReturnUrl.Trim(),
            CancelUrl = body.CancelUrl.Trim()
        };

        IBillingProvider provider = _billingProviderRegistry.ResolveActiveProvider();

        BillingCheckoutResult result;

        try
        {
            result = await provider.CreateCheckoutSessionAsync(request, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            ArchLucidInstrumentation.RecordBillingCheckout(provider.ProviderName, tier.ToString(), "provider_error");

            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        ArchLucidInstrumentation.RecordBillingCheckout(provider.ProviderName, tier.ToString(), "session_created");

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.BillingCheckoutCompleted,
                ActorUserId = User.Identity?.Name ?? "admin",
                ActorUserName = User.Identity?.Name ?? "admin",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        provider = provider.ProviderName,
                        tier = tier.ToString(),
                        providerSessionId = result.ProviderSessionId
                    })
            },
            cancellationToken);

        return Ok(
            new BillingCheckoutResponseDto
            {
                CheckoutUrl = result.CheckoutUrl,
                ProviderSessionId = result.ProviderSessionId,
                ExpiresUtc = result.ExpiresUtc
            });
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("portal")]
    [SkipTrialWriteLimit]
    [ProducesResponseType(typeof(BillingPortalResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PortalAsync(
        [FromBody] BillingPortalPostRequest? body,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (body is null || string.IsNullOrWhiteSpace(body.ReturnUrl))
        {
            return this.BadRequestProblem(
                "ReturnUrl is required.",
                ProblemTypes.ValidationFailed);
        }

        IBillingProvider providerForAudit = _billingProviderRegistry.ResolveActiveProvider();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.BillingPortalInitiated,
                ActorUserId = User.Identity?.Name ?? "admin",
                ActorUserName = User.Identity?.Name ?? "admin",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { provider = providerForAudit.ProviderName })
            },
            cancellationToken);

        BillingPortalRequest request = new()
        {
            TenantId = scope.TenantId,
            ReturnUrl = body.ReturnUrl.Trim()
        };

        IBillingProvider provider = _billingProviderRegistry.ResolveActiveProvider();

        BillingPortalResult result;

        try
        {
            result = await provider.CreateBillingPortalSessionAsync(request, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.BillingPortalCompleted,
                ActorUserId = User.Identity?.Name ?? "admin",
                ActorUserName = User.Identity?.Name ?? "admin",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        provider = provider.ProviderName,
                        providerSessionId = result.ProviderSessionId
                    })
            },
            cancellationToken);

        return Ok(
            new BillingPortalResponseDto
            {
                PortalUrl = result.PortalUrl,
                ProviderSessionId = result.ProviderSessionId
            });
    }

    [HttpGet("subscription")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(BillingSubscriptionStatusResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubscriptionStatusAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        BillingSubscriptionSnapshot? snapshot =
            await _billingLedger.TryGetSubscriptionAsync(scope.TenantId, cancellationToken);

        if (snapshot is null)
        {
            return Ok(
                new BillingSubscriptionStatusResponseDto
                {
                    HasSubscription = false,
                    IsPaymentPastDue = false
                });
        }

        bool isPastDue = string.Equals(snapshot.Status, "Suspended", StringComparison.OrdinalIgnoreCase);

        return Ok(
            new BillingSubscriptionStatusResponseDto
            {
                HasSubscription = true,
                Provider = snapshot.Provider,
                TierCode = snapshot.TierCode,
                Status = snapshot.Status,
                IsPaymentPastDue = isPastDue
            });
    }

    private static BillingCheckoutTier ParseCheckoutTier(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
            return BillingCheckoutTier.Team;

        return label.Trim() switch
        {
            "Architect" => BillingCheckoutTier.Architect,
            "Pro" => BillingCheckoutTier.Pro,
            "Enterprise" => BillingCheckoutTier.Enterprise,
            _ => BillingCheckoutTier.Team
        };
    }

    /// <summary>Sends a synthetic ping to the configured Azure Marketplace webhook URL.</summary>
    [HttpPost("marketplace/webhook-test")]
    [ProducesResponseType(typeof(OutboundWebhookDryRunResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestMarketplaceWebhookAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        OutboundWebhookDryRunResult outcome =
            await _marketplaceWebhookConnectivityService.TestConfiguredWebhookAsync(cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.OutboundWebhookDryRunProbeExecuted,
                ActorUserId = User.Identity?.Name ?? "admin",
                ActorUserName = User.Identity?.Name ?? "admin",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    probeKind = "billing_marketplace_webhook_configured",
                    transportSucceeded = outcome.TransportSucceeded,
                    statusCode = outcome.StatusCode,
                    reasonPhrase = outcome.ReasonPhrase,
                    error = outcome.Error,
                }),
            },
            cancellationToken);

        return Ok(new OutboundWebhookDryRunResponse
        {
            TransportSucceeded = outcome.TransportSucceeded,
            StatusCode = outcome.StatusCode,
            ReasonPhrase = outcome.ReasonPhrase,
            ResponseBodyPreview = outcome.ResponseBodyPreview,
            ResponseBodyTruncated = outcome.ResponseBodyTruncated,
            Error = outcome.Error,
        });
    }
}
