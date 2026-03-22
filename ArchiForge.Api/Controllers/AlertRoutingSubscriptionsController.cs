using System.Text.Json;
using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Alerts.Delivery;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/alert-routing-subscriptions")]
[EnableRateLimiting("fixed")]
public sealed class AlertRoutingSubscriptionsController : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider;
    private readonly IAlertRoutingSubscriptionRepository _subscriptionRepository;
    private readonly IAlertDeliveryAttemptRepository _attemptRepository;
    private readonly IAuditService _auditService;

    public AlertRoutingSubscriptionsController(
        IScopeContextProvider scopeProvider,
        IAlertRoutingSubscriptionRepository subscriptionRepository,
        IAlertDeliveryAttemptRepository attemptRepository,
        IAuditService auditService)
    {
        _scopeProvider = scopeProvider;
        _subscriptionRepository = subscriptionRepository;
        _attemptRepository = attemptRepository;
        _auditService = auditService;
    }

    [HttpPost]
    [Authorize(Policy = ArchiForgePolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertRoutingSubscription), StatusCodes.Status200OK)]
    public async Task<ActionResult<AlertRoutingSubscription>> Create(
        [FromBody] AlertRoutingSubscription subscription,
        CancellationToken ct = default)
    {
        var scope = _scopeProvider.GetCurrentScope();

        subscription.RoutingSubscriptionId = Guid.NewGuid();
        subscription.TenantId = scope.TenantId;
        subscription.WorkspaceId = scope.WorkspaceId;
        subscription.ProjectId = scope.ProjectId;
        subscription.CreatedUtc = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(subscription.MetadataJson))
            subscription.MetadataJson = "{}";

        await _subscriptionRepository.CreateAsync(subscription, ct);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AlertRoutingSubscriptionCreated,
                DataJson = JsonSerializer.Serialize(new
                {
                    subscription.RoutingSubscriptionId,
                    subscription.Name,
                    subscription.ChannelType,
                    subscription.MinimumSeverity,
                }),
            },
            ct);

        return Ok(subscription);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AlertRoutingSubscription>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AlertRoutingSubscription>>> List(CancellationToken ct = default)
    {
        var scope = _scopeProvider.GetCurrentScope();

        var result = await _subscriptionRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return Ok(result);
    }

    [HttpPost("{routingSubscriptionId:guid}/toggle")]
    [Authorize(Policy = ArchiForgePolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AlertRoutingSubscription), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertRoutingSubscription>> Toggle(
        Guid routingSubscriptionId,
        CancellationToken ct = default)
    {
        var subscription = await _subscriptionRepository.GetByIdAsync(routingSubscriptionId, ct);
        if (subscription is null)
            return NotFound();

        var scope = _scopeProvider.GetCurrentScope();
        if (!MatchesScope(subscription, scope))
            return NotFound();

        subscription.IsEnabled = !subscription.IsEnabled;
        await _subscriptionRepository.UpdateAsync(subscription, ct);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AlertRoutingSubscriptionToggled,
                DataJson = JsonSerializer.Serialize(new
                {
                    routingSubscriptionId,
                    enabled = subscription.IsEnabled,
                }),
            },
            ct);

        return Ok(subscription);
    }

    [HttpGet("{routingSubscriptionId:guid}/attempts")]
    [ProducesResponseType(typeof(IReadOnlyList<AlertDeliveryAttempt>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<AlertDeliveryAttempt>>> GetAttempts(
        Guid routingSubscriptionId,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        var subscription = await _subscriptionRepository.GetByIdAsync(routingSubscriptionId, ct);
        if (subscription is null)
            return NotFound();

        var scope = _scopeProvider.GetCurrentScope();
        if (!MatchesScope(subscription, scope))
            return NotFound();

        var attempts = await _attemptRepository.ListBySubscriptionAsync(routingSubscriptionId, take, ct);
        return Ok(attempts);
    }

    private static bool MatchesScope(AlertRoutingSubscription subscription, ScopeContext scope) =>
        subscription.TenantId == scope.TenantId &&
        subscription.WorkspaceId == scope.WorkspaceId &&
        subscription.ProjectId == scope.ProjectId;
}
