using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Alerts.Delivery;

namespace ArchLucid.Api.Services;

public sealed class WebhookSubscriptionTestService(
    IScopeContextProvider scopeProvider,
    IAlertRoutingSubscriptionRepository subscriptionRepository,
    IOutboundWebhookDryRunService probe,
    IAuditService auditService) : IWebhookSubscriptionTestService
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOutboundWebhookDryRunService _probe =
        probe ?? throw new ArgumentNullException(nameof(probe));

    private readonly IAlertRoutingSubscriptionRepository _subscriptionRepository =
        subscriptionRepository ?? throw new ArgumentNullException(nameof(subscriptionRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    [InformationalAudit]
    public async Task<WebhookSubscriptionTestResult> TestAsync(
        Guid routingSubscriptionId,
        CancellationToken cancellationToken = default)
    {
        AlertRoutingSubscription? subscription =
            await _subscriptionRepository.GetByIdAsync(routingSubscriptionId, cancellationToken);

        if (subscription is null)
        {
            return NotFound($"Routing subscription '{routingSubscriptionId}' was not found.");
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!MatchesScope(subscription, scope))
        {
            return NotFound(
                $"Routing subscription '{routingSubscriptionId}' was not found in the current scope.");
        }

        if (!IsWebhookChannelType(subscription.ChannelType))
        {
            return BadRequest(
                $"Subscription '{routingSubscriptionId}' uses channel type '{subscription.ChannelType}' which does not support a ping test. Only webhook channel types are supported.");
        }

        if (!Uri.TryCreate(subscription.Destination, UriKind.Absolute, out Uri? destinationUri))
        {
            return BadRequest(
                $"Subscription '{routingSubscriptionId}' destination is not a valid absolute URI.");
        }

        string? sharedSecret = WebhookSubscriptionSharedSecretReader.TryRead(subscription.MetadataJson);

        OutboundWebhookDryRunResult outcome =
            await _probe.ProbeAsync(destinationUri, sharedSecret, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AlertRoutingWebhookPingExecuted,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    routingSubscriptionId,
                    channelType = subscription.ChannelType,
                    transportSucceeded = outcome.TransportSucceeded,
                    statusCode = outcome.StatusCode,
                    reasonPhrase = outcome.ReasonPhrase,
                    signed = !string.IsNullOrEmpty(sharedSecret),
                    error = outcome.Error
                })
            },
            cancellationToken);

        return new WebhookSubscriptionTestResult
        {
            IsSuccess = true,
            Response = new OutboundWebhookDryRunResponse
            {
                TransportSucceeded = outcome.TransportSucceeded,
                StatusCode = outcome.StatusCode,
                ReasonPhrase = outcome.ReasonPhrase,
                ResponseBodyPreview = outcome.ResponseBodyPreview,
                ResponseBodyTruncated = outcome.ResponseBodyTruncated,
                Error = outcome.Error
            }
        };
    }

    private static WebhookSubscriptionTestResult NotFound(string detail) =>
        new()
        {
            IsSuccess = false,
            ErrorStatusCode = StatusCodes.Status404NotFound,
            ErrorDetail = detail,
            ErrorProblemType = ProblemTypes.ResourceNotFound
        };

    private static WebhookSubscriptionTestResult BadRequest(string detail) =>
        new()
        {
            IsSuccess = false,
            ErrorStatusCode = StatusCodes.Status400BadRequest,
            ErrorDetail = detail,
            ErrorProblemType = ProblemTypes.ValidationFailed
        };

    private static bool IsWebhookChannelType(string channelType)
    {
        return channelType is AlertRoutingChannelType.TeamsWebhook
            or AlertRoutingChannelType.SlackWebhook
            or AlertRoutingChannelType.OnCallWebhook;
    }

    private static bool MatchesScope(AlertRoutingSubscription subscription, ScopeContext scope)
    {
        return subscription.TenantId == scope.TenantId &&
               subscription.WorkspaceId == scope.WorkspaceId &&
               subscription.ProjectId == scope.ProjectId;
    }
}
