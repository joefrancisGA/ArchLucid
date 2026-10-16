using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ToxicCombinationPathLoader
{
    public static IReadOnlyList<ToxicCombinationPathSnapshot> BuildSnapshots(
        IReadOnlyList<SecurityEvidencePathWithHops> paths,
        PathKind pathKind,
        AzureInventorySnapshotDetailReadModel snapshot,
        SecureNowAnalysisSnapshot? analysisSnapshot = null)
    {
        List<ToxicCombinationPathSnapshot> snapshots = [];
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesByArmId =
            (analysisSnapshot ?? new SecureNowAnalysisSnapshot(snapshot)).ResourcesByArmId;

        foreach (SecurityEvidencePathWithHops item in paths.Where(item => item.Path.PathKind == pathKind)
                     .OrderByDescending(item => item.Path.CreatedUtc).ThenBy(item => item.Path.PathId))
        {
            SecurityEvidencePathRecord path = item.Path;
            IReadOnlyList<SecurityEvidencePathHopRecord> hops = item.Hops;
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

        return snapshots;
    }
}
