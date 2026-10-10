using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

internal static class AzureInventoryReferencedEndpointNodeFactory
{
    public static bool IsHiddenEndpoint(string armId, IReadOnlySet<string> collectedArmIds, IReadOnlySet<string> hiddenArmIds, bool retainIdentityDiagramArmTypes)
    {
        return hiddenArmIds.Contains(armId)
            || (!collectedArmIds.Contains(armId)
                && TryReadResourceType(armId, out string resourceType)
                && AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                    resourceType, armId, retainIdentityDiagramArmTypes: retainIdentityDiagramArmTypes));
    }

    public static void EnsureNode(
        string normalizedArmId,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds)
    {
        if (nodeIdByArmId.ContainsKey(normalizedArmId)
            || !TryReadResourceType(normalizedArmId, out string resourceType))
        {
            return;
        }

        string nodeId = "referenced-" + Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(normalizedArmId)));
        if (seenNodeIds.Add(nodeId))
        {
            nodes.Add(new GraphNode
            {
                NodeId = nodeId,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = normalizedArmId[(normalizedArmId.LastIndexOf('/') + 1)..] + " (Referenced; details not collected)",
                Category = AzureInventoryTopologyCategory.Resolve(resourceType),
                SourceType = "azure-inventory-snapshot",
                SourceId = normalizedArmId,
                Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["arm.id"] = normalizedArmId,
                    ["arm.type"] = resourceType,
                    ["arm.stub"] = "referenced-resource",
                    ["inventory.collectionStatus"] = "referenced-not-collected",
                },
            });
        }

        nodeIdByArmId[normalizedArmId] = nodeId;
    }

    public static bool TryReadResourceType(string armId, out string resourceType)
    {
        resourceType = string.Empty;
        string[] segments = armId.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (!armId.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || segments.Length < 8
            || !segments[2].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase)
            || !segments[4].Equals("providers", StringComparison.OrdinalIgnoreCase)
            || segments.Length % 2 != 0)
        {
            return false;
        }

        List<string> typeParts = [segments[5]];
        for (int index = 6; index < segments.Length; index += 2)
        {
            // Extension resources restart the namespace/type path.
            if (segments[index].Equals("providers", StringComparison.OrdinalIgnoreCase))
            {
                typeParts = [segments[index + 1]];
            }
            else
            {
                typeParts.Add(segments[index]);
            }
        }

        if (typeParts.Count < 2)
        {
            return false;
        }

        resourceType = string.Join('/', typeParts);
        return true;
    }
}
