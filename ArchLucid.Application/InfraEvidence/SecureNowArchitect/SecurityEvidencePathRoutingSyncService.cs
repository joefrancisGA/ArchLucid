using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Core.InfraEvidence;

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
            (await SecureNowAnalysisRun.LoadAsync(snapshotRepository, scope, snapshotId, cancellationToken))?.Snapshot;

        if (snapshot is null)
        {
            return;
        }

        IReadOnlyList<SecurityEvidencePathWithHops> pathsWithHops = await pathRepository.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId),
            cancellationToken);

        if (pathsWithHops.Count == 0)
        {
            return;
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        foreach (SecurityEvidencePathWithHops pathWithHops in pathsWithHops)
        {
            IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows =
                SecurityEvidencePathRoutingMaterializer.MaterializeFromSnapshotTags(
                    scope.TenantId,
                    pathWithHops.Path.PathId,
                    pathWithHops.Hops,
                    snapshot,
                    utcNow);

            await routingRepository.ReplaceRoutingForPathInScopeAsync(
                scope.ToProjectScopeKey(),
                pathWithHops.Path.PathId,
                routingRows,
                cancellationToken);
        }
    }
}
