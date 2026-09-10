using ArchLucid.Core.Findings;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings.FindingVerification;

/// <summary>ADR 0062 / TB-2034: integration outbox fan-out when a verification report is appended.</summary>
internal static class FindingVerificationIntegrationEventPublishing
{
    internal static async Task TryPublishCompletedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        ScopeContext scope,
        FindingVerificationReportRecord record,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);

        Dictionary<string, int> statusCounts = record.Results
            .GroupBy(result => result.Status)
            .ToDictionary(
                group => group.Key.ToString(),
                group => group.Count(),
                StringComparer.Ordinal);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            runId = record.RunId,
            reportId = record.ReportId,
            reportHash = record.ReportHash,
            manifestHash = record.SourceManifestHash,
            sourceFindingsSnapshotId = record.SourceFindingsSnapshotId,
            verificationFindingsSnapshotId = record.VerificationFindingsSnapshotId,
            resultCount = record.Results.Count,
            statusCounts,
            createdUtc = record.CreatedUtc,
        };

        string messageId =
            $"{record.ReportId:D}:{IntegrationEventTypes.FindingVerificationCompletedV1}";

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.FindingVerificationCompletedV1,
            payload,
            messageId,
            record.RunId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            connection: null,
            transaction: null,
            cancellationToken);
    }
}
