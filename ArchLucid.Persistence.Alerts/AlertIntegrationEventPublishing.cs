using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Persistence.Integration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Publishes alert lifecycle integration events (Service Bus) after persistence and delivery.</summary>
internal static class AlertIntegrationEventPublishing
{
    internal static Task TryPublishFiredAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        AlertRecord alert,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(alert);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = alert.TenantId,
            workspaceId = alert.WorkspaceId,
            projectId = alert.ProjectId,
            alertId = alert.AlertId,
            runId = alert.RunId,
            comparedToRunId = alert.ComparedToRunId,
            ruleId = alert.RuleId,
            category = alert.Category,
            severity = alert.Severity,
            title = alert.Title,
            deduplicationKey = alert.DeduplicationKey,
        };

        string messageId = $"{alert.AlertId:D}:{IntegrationEventTypes.AlertFiredV1}";

        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.AlertFiredV1,
            payload,
            messageId,
            alert.RunId,
            alert.TenantId,
            alert.WorkspaceId,
            alert.ProjectId,
            connection: null,
            transaction: null,
            cancellationToken);
    }

    internal static Task TryPublishResolvedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        AlertRecord alert,
        string userId,
        string? comment,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(alert);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = alert.TenantId,
            workspaceId = alert.WorkspaceId,
            projectId = alert.ProjectId,
            alertId = alert.AlertId,
            runId = alert.RunId,
            resolvedByUserId = userId,
            comment,
        };

        string messageId = $"{alert.AlertId:D}:{IntegrationEventTypes.AlertResolvedV1}";

        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.AlertResolvedV1,
            payload,
            messageId,
            alert.RunId,
            alert.TenantId,
            alert.WorkspaceId,
            alert.ProjectId,
            connection: null,
            transaction: null,
            cancellationToken);
    }
}
