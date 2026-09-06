using ArchLucid.Application.Integration;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-31 suggestion 378: compliance drift escalation integration events with optional run-scoped manifestHash metadata.</summary>
public static class ComplianceDriftIntegrationEventPublishing
{
    public static async Task TryPublishEscalatedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        ScopeContext scope,
        Guid driftSignalId,
        string metricKey,
        double? thresholdValue,
        double? observedValue,
        Guid? runId,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(metricKey);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (driftSignalId == Guid.Empty)
            return;

        string? manifestHash = null;

        if (runId is Guid resolvedRunId && resolvedRunId != Guid.Empty)
        {
            manifestHash = await RunIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashOrNullAsync(
                resolvedRunId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }

        DateTimeOffset escalatedUtc = TimeProvider.System.GetUtcNow();

        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            driftSignalId,
            escalatedUtc = escalatedUtc.ToString("O"),
            metricKey,
            thresholdValue,
            observedValue,
            runId = runId is Guid run && run != Guid.Empty ? run : (Guid?)null,
            manifestHash,
        };

        string messageSuffix = string.IsNullOrWhiteSpace(idempotencyKey)
            ? escalatedUtc.UtcTicks.ToString(System.Globalization.CultureInfo.InvariantCulture)
            : idempotencyKey.Trim();

        string messageId =
            $"{scope.TenantId:D}:{driftSignalId:D}:{IntegrationEventTypes.ComplianceDriftEscalatedV1}:{messageSuffix}";

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.ComplianceDriftEscalatedV1,
            payload,
            messageId,
            null,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            connection: null,
            transaction: null,
            cancellationToken);
    }
}
