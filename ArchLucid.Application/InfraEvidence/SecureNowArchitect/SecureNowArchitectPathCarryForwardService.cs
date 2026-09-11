using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecureNowArchitectPathCarryForwardService(ISecurityEvidencePathRepository pathRepository)
{
    public async Task<int> CarryForwardAsync(
        ScopeContext scope,
        Guid fromSnapshotId,
        Guid toSnapshotId,
        IReadOnlySet<Guid>? excludeCloudResourceIds,
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (fromSnapshotId == Guid.Empty || toSnapshotId == Guid.Empty || fromSnapshotId == toSnapshotId)
        {
            return 0;
        }

        IReadOnlyList<SecurityEvidencePathRecord> sourcePaths = await pathRepository.ListBySnapshotAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            fromSnapshotId,
            cancellationToken);

        if (sourcePaths.Count == 0)
        {
            return 0;
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        int carried = 0;

        foreach (SecurityEvidencePathRecord sourcePath in sourcePaths)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> sourceHops =
                await pathRepository.ListHopsByPathAsync(scope.TenantId, sourcePath.PathId, cancellationToken);

            if (excludeCloudResourceIds is not null
                && excludeCloudResourceIds.Count > 0
                && SecureNowArchitectNeighborhoodFilter.PathTouchesSeeds(
                    sourceHops,
                    excludeCloudResourceIds,
                    cloudResourceIdByArmId))
            {
                continue;
            }

            Guid newPathId = Guid.NewGuid();
            List<SecurityEvidencePathHopRecord> copiedHops = [];

            foreach (SecurityEvidencePathHopRecord hop in sourceHops.OrderBy(static item => item.HopOrdinal))
            {
                copiedHops.Add(new SecurityEvidencePathHopRecord
                {
                    HopRowId = Guid.NewGuid(),
                    PathId = newPathId,
                    TenantId = hop.TenantId,
                    HopOrdinal = hop.HopOrdinal,
                    FromNodeId = hop.FromNodeId,
                    ToNodeId = hop.ToNodeId,
                    EdgeType = hop.EdgeType,
                    ProvenanceKind = hop.ProvenanceKind,
                    HopConfidenceBand = hop.HopConfidenceBand,
                    InferenceSource = hop.InferenceSource,
                    EvidenceReference = hop.EvidenceReference,
                    CloudResourceId = hop.CloudResourceId,
                });
            }

            SecurityEvidencePathRecord header = new()
            {
                PathId = newPathId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SnapshotId = toSnapshotId,
                PathKind = sourcePath.PathKind,
                PathConfidenceBand = sourcePath.PathConfidenceBand,
                CrownJewelAssertionId = sourcePath.CrownJewelAssertionId,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            };

            SecurityEvidencePathInsertResult insertResult =
                await pathRepository.InsertIfNotExistsAsync(header, copiedHops, cancellationToken);

            if (insertResult.Created)
            {
                carried++;
            }
        }

        return carried;
    }
}
