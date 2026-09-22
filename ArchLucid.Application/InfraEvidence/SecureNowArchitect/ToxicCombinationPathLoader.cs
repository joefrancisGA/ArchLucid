using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ToxicCombinationPathLoader
{
    public static async Task<IReadOnlyList<ToxicCombinationPathSnapshot>> LoadSnapshotsAsync(
        ISecurityEvidencePathRepository pathRepository,
        ScopeContext scope,
        Guid snapshotId,
        PathKind pathKind,
        AzureInventorySnapshotDetailReadModel snapshot,
        CancellationToken cancellationToken)
    {
        List<ToxicCombinationPathSnapshot> snapshots = [];
        Dictionary<string, AzureInventoryResourceRecord> resourcesByArmId =
            snapshot.Resources.ToDictionary(static resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        int page = 1;
        const int pageSize = 200;
        int loadedCount = 0;
        int totalCount;

        do
        {
            (IReadOnlyList<SecurityEvidencePathRecord> items, totalCount) = await pathRepository.ListPagedAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                new SecurityEvidencePathListFilter
                {
                    SnapshotId = snapshotId,
                    PathKind = pathKind,
                },
                page,
                pageSize,
                cancellationToken);

            foreach (SecurityEvidencePathRecord path in items)
            {
                IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                    await pathRepository.ListHopsByPathAsync(scope.TenantId, path.PathId, cancellationToken);

                if (hops.Count == 0)
                {
                    continue;
                }

                HashSet<string> nodeIds = new(StringComparer.OrdinalIgnoreCase);

                foreach (SecurityEvidencePathHopRecord hop in hops)
                {
                    nodeIds.Add(hop.FromNodeId);
                    nodeIds.Add(hop.ToNodeId);
                }

                string terminalNodeId = hops[^1].ToNodeId;
                Guid? terminalCloudResourceId = null;
                string? terminalResourceType = null;

                if (resourcesByArmId.TryGetValue(terminalNodeId, out AzureInventoryResourceRecord? terminalResource))
                {
                    terminalCloudResourceId = terminalResource.CloudResourceId;
                    terminalResourceType = terminalResource.ResourceType;
                }

                snapshots.Add(new ToxicCombinationPathSnapshot
                {
                    Path = path,
                    Hops = hops,
                    NodeIds = nodeIds,
                    TerminalNodeId = terminalNodeId,
                    TerminalCloudResourceId = terminalCloudResourceId,
                    TerminalResourceType = terminalResourceType,
                });
            }

            loadedCount += items.Count;
            page++;
        }
        while (loadedCount < totalCount);

        return snapshots;
    }
}
