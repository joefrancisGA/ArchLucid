using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public interface ISecurityEvidencePathRoutingSyncService
{
    Task SyncSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);
}

public sealed class SecurityEvidencePathRoutingSyncService(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidencePathRoutingRepository routingRepository) : ISecurityEvidencePathRoutingSyncService
{
    public async Task SyncSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
        {
            return;
        }

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return;
        }

        IReadOnlyList<SecurityEvidencePathRecord> paths = await pathRepository.ListBySnapshotAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            snapshotId,
            cancellationToken);

        if (paths.Count == 0)
        {
            return;
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        foreach (SecurityEvidencePathRecord path in paths)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                await pathRepository.ListHopsByPathAsync(scope.TenantId, path.PathId, cancellationToken);

            IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows =
                SecurityEvidencePathRoutingMaterializer.MaterializeFromSnapshotTags(
                    scope.TenantId,
                    path.PathId,
                    hops,
                    snapshot,
                    utcNow);

            await routingRepository.ReplaceRoutingForPathAsync(
                scope.TenantId,
                path.PathId,
                routingRows,
                cancellationToken);
        }
    }
}
