using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventorySnapshotHeaderService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureExtractorPackageRepository packageRepository,
    IAuditService auditService,
    ILogger<AzureInventorySnapshotHeaderService> logger) : IAzureInventorySnapshotHeaderService
{
    public async Task<AzureInventorySnapshotHeaderCreateResult> TryCreatePendingFromPackageAsync(
        ScopeContext scope,
        Guid packageId,
        string? subscriptionId,
        string? subscriptionName,
        DateTime? capturedUtc,
        string? captureVersion,
        string? collectorVersion,
        string requestedBy,
        bool allowRecapture,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(requestedBy))
            throw new ArgumentException("RequestedBy is required.", nameof(requestedBy));

        try
        {
            AzureExtractorPackageDownloadRecord? package =
                await packageRepository.TryGetDownloadByPackageIdAsync(scope, packageId, cancellationToken);

            if (package is null)
            {
                return await FailAsync(
                    scope,
                    packageId,
                    requestedBy,
                    "Extractor package was not found in the current scope.",
                    cancellationToken);
            }

            AzureInventorySnapshotRecord? existing =
                await snapshotRepository.TryGetByPackageIdAsync(scope, packageId, cancellationToken);

            if (existing is not null && !allowRecapture)
            {
                return new AzureInventorySnapshotHeaderCreateResult
                {
                    Succeeded = true,
                    WasExisting = true,
                    SnapshotId = existing.SnapshotId,
                };
            }

            DateTime utcNow = TimeProvider.System.UtcNowDateTime();
            Guid snapshotId = Guid.NewGuid();

            AzureInventorySnapshotRecord record = new()
            {
                SnapshotId = snapshotId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                PackageId = packageId,
                SubscriptionId = subscriptionId,
                SubscriptionName = subscriptionName,
                CapturedUtc = capturedUtc,
                CaptureStatus = AzureInventoryCaptureStatus.Pending,
                CaptureVersion = captureVersion,
                ResourceCount = 0,
                RelationshipCount = 0,
                CaptureMethod = AzureInventoryCaptureMethod.Unknown,
                CollectorVersion = collectorVersion,
                RequestedBy = requestedBy,
                WarningCount = 0,
                ErrorCount = 0,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            };

            await snapshotRepository.InsertHeaderAsync(record, cancellationToken);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AzureInventorySnapshotCreated,
                    ActorUserId = requestedBy,
                    ActorUserName = requestedBy,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new { snapshotId, packageId },
                        AuditJsonSerializationOptions.Instance),
                },
                cancellationToken);

            return new AzureInventorySnapshotHeaderCreateResult
            {
                Succeeded = true,
                WasExisting = false,
                SnapshotId = snapshotId,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Azure inventory snapshot header creation failed for PackageId={PackageId}.", packageId);

            return await FailAsync(scope, packageId, requestedBy, ex.Message, cancellationToken);
        }
    }

    private async Task<AzureInventorySnapshotHeaderCreateResult> FailAsync(
        ScopeContext scope,
        Guid packageId,
        string requestedBy,
        string message,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AzureInventorySnapshotFailed,
                ActorUserId = requestedBy,
                ActorUserName = requestedBy,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { packageId, message },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return new AzureInventorySnapshotHeaderCreateResult
        {
            Succeeded = false,
            ErrorMessage = message,
        };
    }
}
