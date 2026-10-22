using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Comparison;

public sealed partial class ComparisonService
{
    private static void CompareTopology(ManifestDocument baseM, ManifestDocument targetM, ComparisonResult result)
    {
        HashSet<string> baseSet = new(baseM.Topology.Resources, StringComparer.OrdinalIgnoreCase);
        HashSet<string> targetSet = new(targetM.Topology.Resources, StringComparer.OrdinalIgnoreCase);

        foreach (string r in targetSet.Where(r => !baseSet.Contains(r)))

            result.TopologyChanges.Add(new TopologyDelta { Resource = r, ChangeType = "Added" });

        foreach (string r in baseSet.Where(r => !targetSet.Contains(r)))

            result.TopologyChanges.Add(new TopologyDelta { Resource = r, ChangeType = "Removed" });
    }
}
