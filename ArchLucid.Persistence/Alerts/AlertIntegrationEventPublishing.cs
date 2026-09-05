using ArchLucid.Core.Integration;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Publishes alert lifecycle integration events (Service Bus) after persistence and delivery.</summary>
internal static class AlertIntegrationEventPublishing
{
    internal static async Task TryPublishFiredAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        AlertRecord alert,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(alert);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string? manifestHash = await AlertIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashAsync(
            alert,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

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
            manifestHash,
        };

        string messageId = $"{alert.AlertId:D}:{IntegrationEventTypes.AlertFiredV1}";

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
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

    internal static async Task TryPublishResolvedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        AlertRecord alert,
        string userId,
        string? comment,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(alert);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string? manifestHash = await AlertIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashAsync(
            alert,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = alert.TenantId,
            workspaceId = alert.WorkspaceId,
            projectId = alert.ProjectId,
            alertId = alert.AlertId,
            runId = alert.RunId,
            deduplicationKey = alert.DeduplicationKey,
            resolvedByUserId = userId,
            comment,
            manifestHash,
        };

        string messageId = $"{alert.AlertId:D}:{IntegrationEventTypes.AlertResolvedV1}";

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
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

    internal static async Task TryPublishAcknowledgedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        AlertRecord alert,
        string acknowledgedByUserId,
        string? comment,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(alert);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string? manifestHash = await AlertIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashAsync(
            alert,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = alert.TenantId,
            workspaceId = alert.WorkspaceId,
            projectId = alert.ProjectId,
            alertId = alert.AlertId,
            runId = alert.RunId,
            deduplicationKey = alert.DeduplicationKey,
            acknowledgedByUserId,
            comment,
            manifestHash,
        };

        string messageId = $"{alert.AlertId:D}:{IntegrationEventTypes.AlertAcknowledgedV1}";

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.AlertAcknowledgedV1,
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
