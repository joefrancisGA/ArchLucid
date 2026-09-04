using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventoryDiffService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryDiffRepository diffRepository,
    IEnumerable<IAzureInventoryDiffConsumer> diffConsumers,
    ILogger<AzureInventoryDiffService> logger) : IAzureInventoryDiffService
{
    public async Task<AzureInventoryDiffComputeResult> ComputeAndPersistDiffAsync(
        ScopeContext scope,
        Guid snapshotAId,
        Guid snapshotBId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            AzureInventoryDiffSummaryRecord? existing =
                await diffRepository.TryGetBySnapshotPairAsync(scope, snapshotAId, snapshotBId, cancellationToken);

            if (existing is not null)
            {
                IReadOnlyList<AzureInventoryChangeRecord> existingChanges =
                    await diffRepository.ListChangesByDiffIdAsync(scope, existing.DiffId, cancellationToken);

                return new AzureInventoryDiffComputeResult
                {
                    Succeeded = true,
                    WasExisting = true,
                    DiffId = existing.DiffId,
                    Summary = existing,
                    Changes = existingChanges,
                };
            }

            AzureInventorySnapshotDetailReadModel? snapshotA =
                await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotAId, cancellationToken);

            AzureInventorySnapshotDetailReadModel? snapshotB =
                await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotBId, cancellationToken);

            if (snapshotA is null || snapshotB is null)
            {
                return new AzureInventoryDiffComputeResult
                {
                    Succeeded = false,
                    ErrorMessage = "One or both snapshot headers were not found in the current scope.",
                };
            }

            if (!string.Equals(snapshotA.Header.SubscriptionId, snapshotB.Header.SubscriptionId, StringComparison.OrdinalIgnoreCase))
            {
                return new AzureInventoryDiffComputeResult
                {
                    Succeeded = false,
                    ErrorMessage = "Snapshots must belong to the same Azure subscription.",
                };
            }

            if (snapshotA.Header.ContentHashSha256 is not null
                && snapshotB.Header.ContentHashSha256 is not null
                && snapshotA.Header.ContentHashSha256.SequenceEqual(snapshotB.Header.ContentHashSha256))
            {
                return await PersistEmptyDiffAsync(scope, snapshotAId, snapshotBId, snapshotA.Header.SubscriptionId, cancellationToken);
            }

            List<AzureInventoryChangeRecord> changes =
                AzureInventoryDiffComparer.Compare(snapshotA, snapshotB, snapshotAId, snapshotBId);

            Guid diffId = Guid.NewGuid();
            AzureInventoryDiffSummaryRecord summary = BuildSummary(diffId, changes, snapshotAId, snapshotBId, snapshotA.Header.SubscriptionId);

            AzureInventoryDiffPersistResult persisted = await diffRepository.InsertDiffAsync(
                scope,
                new AzureInventoryDiffPersistRequest
                {
                    DiffId = diffId,
                    SnapshotAId = snapshotAId,
                    SnapshotBId = snapshotBId,
                    SubscriptionId = snapshotA.Header.SubscriptionId,
                    Summary = summary,
                    Changes = changes,
                },
                cancellationToken);

            foreach (IAzureInventoryDiffConsumer consumer in diffConsumers)
            {
                await consumer.OnDiffComputedAsync(persisted.Summary, changes, cancellationToken);
            }

            return new AzureInventoryDiffComputeResult
            {
                Succeeded = true,
                WasExisting = persisted.WasExisting,
                DiffId = persisted.DiffId,
                Summary = persisted.Summary,
                Changes = changes,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Azure inventory diff failed for SnapshotA={SnapshotAId} SnapshotB={SnapshotBId}.",
                snapshotAId,
                snapshotBId);

            return new AzureInventoryDiffComputeResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    private async Task<AzureInventoryDiffComputeResult> PersistEmptyDiffAsync(
        ScopeContext scope,
        Guid snapshotAId,
        Guid snapshotBId,
        string? subscriptionId,
        CancellationToken cancellationToken)
    {
        Guid diffId = Guid.NewGuid();
        AzureInventoryDiffSummaryRecord summary = BuildSummary(diffId, [], snapshotAId, snapshotBId, subscriptionId);

        AzureInventoryDiffPersistResult persisted = await diffRepository.InsertDiffAsync(
            scope,
            new AzureInventoryDiffPersistRequest
            {
                DiffId = diffId,
                SnapshotAId = snapshotAId,
                SnapshotBId = snapshotBId,
                SubscriptionId = subscriptionId,
                Summary = summary,
                Changes = [],
            },
            cancellationToken);

        return new AzureInventoryDiffComputeResult
        {
            Succeeded = true,
            WasExisting = persisted.WasExisting,
            DiffId = persisted.DiffId,
            Summary = persisted.Summary,
            Changes = [],
        };
    }

    private static AzureInventoryDiffSummaryRecord BuildSummary(
        Guid diffId,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        Guid snapshotAId,
        Guid snapshotBId,
        string? subscriptionId)
    {
        return new AzureInventoryDiffSummaryRecord
        {
            DiffId = diffId,
            SnapshotAId = snapshotAId,
            SnapshotBId = snapshotBId,
            SubscriptionId = subscriptionId,
            TotalChanges = changes.Count,
            ResourceAddedCount = changes.Count(c => c.ChangeType == AzureInventoryChangeType.ResourceAdded),
            ResourceRemovedCount = changes.Count(c => c.ChangeType == AzureInventoryChangeType.ResourceRemoved),
            ResourceModifiedCount = changes.Count(c => c.ChangeType == AzureInventoryChangeType.ResourceModified),
            NetworkExposureChangeCount = changes.Count(c => c.ChangeType == AzureInventoryChangeType.NetworkExposureChanged),
            PermissionChangeCount = changes.Count(c => c.ChangeType == AzureInventoryChangeType.PermissionChanged),
            LoggingRegressionCount = changes.Count(c =>
                c.ChangeType == AzureInventoryChangeType.LoggingChanged
                && AzureInventoryDiffHeuristics.IsLoggingRegression(c.Property ?? string.Empty, c.OldValue, c.NewValue)),
            NewPrivateEndpointCount = changes.Count(c =>
                c.ChangeType == AzureInventoryChangeType.RelationshipAdded
                && string.Equals(c.Property, "privateEndpoint", StringComparison.OrdinalIgnoreCase)),
            RelationshipRemovedCount = changes.Count(c => c.ChangeType == AzureInventoryChangeType.RelationshipRemoved),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
    }
}
