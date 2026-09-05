using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventoryBaselineService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryBaselineRepository baselineRepository,
    ILogger<AzureInventoryBaselineService> logger) : IAzureInventoryBaselineService
{
    public async Task<AzureInventoryBaselineDesignateResult> TryDesignateBaselineAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventoryBaselineKind baselineKind,
        string designatedBy,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(designatedBy))
        {
            return new AzureInventoryBaselineDesignateResult
            {
                Succeeded = false,
                ErrorMessage = "DesignatedBy is required.",
            };
        }

        try
        {
            AzureInventorySnapshotRecord? snapshot =
                await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

            if (snapshot is null)
            {
                return new AzureInventoryBaselineDesignateResult
                {
                    Succeeded = false,
                    ErrorMessage = "Snapshot was not found in the current scope.",
                };
            }

            Guid baselineId = Guid.NewGuid();
            DateTime designatedUtc = TimeProvider.System.UtcNowDateTime();

            AzureInventoryBaselineRecord record = new()
            {
                BaselineId = baselineId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SnapshotId = snapshotId,
                BaselineKind = baselineKind,
                SubscriptionId = snapshot.SubscriptionId,
                DesignatedBy = designatedBy.Trim(),
                DesignatedUtc = designatedUtc,
                Notes = notes,
            };

            await baselineRepository.InsertAsync(record, cancellationToken);

            return new AzureInventoryBaselineDesignateResult
            {
                Succeeded = true,
                BaselineId = baselineId,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Baseline designation failed for SnapshotId={SnapshotId}.", snapshotId);

            return new AzureInventoryBaselineDesignateResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    public Task<IReadOnlyList<AzureInventoryBaselineRecord>> ListBaselinesAsync(
        ScopeContext scope,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return baselineRepository.ListByScopeAsync(scope, subscriptionId, cancellationToken);
    }
}
