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

        IReadOnlyList<SecurityEvidencePathWithHops> pathsWithHops =
            await pathRepository.ListWithHopsBySnapshotAsync(
                ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId),
                cancellationToken)
            ?? [];

        if (pathsWithHops.Count == 0)
        {
            return;
        }

        List<Guid> cloudResourceIds = pathsWithHops
            .SelectMany(path => path.Hops)
            .Where(hop => hop.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
            .Select(hop => hop.CloudResourceId!.Value)
            .Distinct()
            .ToList();

        IReadOnlyList<AzureInventoryResourceRecord> hopResources =
            await snapshotRepository.ListResourcesByCloudResourceIdsAsync(
                scope,
                snapshotId,
                cloudResourceIds,
                cancellationToken)
            ?? [];

        List<Guid> resourceRowIds = hopResources
            .Select(resource => resource.ResourceRowId)
            .Where(rowId => rowId != Guid.Empty)
            .Distinct()
            .ToList();

        IReadOnlyList<AzureInventoryTagReadModel> hopTags =
            await snapshotRepository.ListTagsByResourceRowIdsAsync(
                scope,
                snapshotId,
                resourceRowIds,
                cancellationToken)
            ?? [];

        SecurityEvidencePathRoutingTagSlice tagSlice = new()
        {
            Resources = hopResources,
            Tags = hopTags,
        };

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        foreach (SecurityEvidencePathWithHops pathWithHops in pathsWithHops)
        {
            IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows =
                SecurityEvidencePathRoutingMaterializer.MaterializeFromRoutingTagSlice(
                    scope.TenantId,
                    pathWithHops.Path.PathId,
                    pathWithHops.Hops,
                    tagSlice,
                    utcNow);

            await routingRepository.ReplaceRoutingForPathInScopeAsync(
                scope.ToProjectScopeKey(),
                pathWithHops.Path.PathId,
                routingRows,
                cancellationToken);
        }
    }
}
