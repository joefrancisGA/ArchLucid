using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.PortfolioSharedTopology;

/// <summary>Collects product-shaped inventory resource ids and posture codes from graph nodes (DX-53).</summary>
public static class SharedResourcePostureCollector
{
    public static IReadOnlyList<SharedResourcePostureEntry> Collect(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<SharedResourcePostureEntry> entries = [];

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (node.Properties is null || node.Properties.Count == 0)
            {
                continue;
            }

            List<string> resourceIds = [];
            FindingEvidenceRefs.TryCollectFromNodeProperties(resourceIds, node.Properties);

            if (resourceIds.Count == 0)
            {
                continue;
            }

            string resourceIdNormalized = resourceIds[0];

            if (!SharedResourcePostureCode.TryDerive(node.Properties, out string postureCode))
            {
                continue;
            }

            entries.Add(new SharedResourcePostureEntry
            {
                NodeId = node.NodeId,
                ResourceIdNormalized = resourceIdNormalized,
                PostureCode = postureCode,
            });
        }

        return entries;
    }
}
