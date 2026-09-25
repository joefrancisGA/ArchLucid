using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>
/// Resolves VNet membership from cited placement facts rather than display labels.
/// </summary>
public static class DiagramForestVnetMembership
{
    public static IReadOnlyDictionary<string, IReadOnlySet<string>> Resolve(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges,
        bool sameResourceGroupOnly = false)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        Dictionary<string, DiagramNode> nodesById = nodes
            .Where(node => node is not null && !string.IsNullOrWhiteSpace(node.NodeId))
            .ToDictionary(node => node.NodeId, StringComparer.Ordinal);
        Dictionary<string, HashSet<string>> membersByVnet = nodes
            .Where(IsVnet)
            .ToDictionary(node => node.NodeId, _ => new HashSet<string>(StringComparer.Ordinal), StringComparer.Ordinal);

        foreach ((string vnetId, HashSet<string> members) in membersByVnet)
        {
            DiagramNode vnet = nodesById[vnetId];
            members.Add(vnetId);

            string vnetArmId = ReadArmId(vnet);
            foreach (DiagramNode candidate in nodesById.Values)
            {
                if (IsDescendantSubnet(candidate, vnetArmId)
                    && IsAllowedResourceGroup(vnet, candidate, sameResourceGroupOnly))
                {
                    members.Add(candidate.NodeId);
                }
            }

            foreach (DiagramEdge edge in edges)
            {
                if (!IsCitedPlacementEdge(edge)
                    || !nodesById.ContainsKey(edge.FromNodeId)
                    || !nodesById.TryGetValue(edge.ToNodeId, out DiagramNode? target))
                {
                    continue;
                }

                bool targetsVnet = string.Equals(target.NodeId, vnetId, StringComparison.Ordinal);
                bool targetsSubnet = IsDescendantSubnet(target, vnetArmId);
                if ((targetsVnet || targetsSubnet)
                    && IsAllowedResourceGroup(vnet, nodesById[edge.FromNodeId], sameResourceGroupOnly))
                {
                    members.Add(edge.FromNodeId);
                }
            }
        }

        return membersByVnet.ToDictionary(
            pair => pair.Key,
            pair => (IReadOnlySet<string>)pair.Value,
            StringComparer.Ordinal);
    }

    public static IReadOnlySet<string> ResolveMembers(
        DiagramNode vnet,
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges,
        bool sameResourceGroupOnly = false)
    {
        ArgumentNullException.ThrowIfNull(vnet);

        return Resolve(nodes, edges, sameResourceGroupOnly)
            .GetValueOrDefault(vnet.NodeId, new HashSet<string>(StringComparer.Ordinal) { vnet.NodeId });
    }

    public static bool IsCitedPlacementEdge(DiagramEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryResourceGroupCollocation, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string source = edge.InferenceSource ?? string.Empty;
        string association = edge.Label ?? string.Empty;
        return IsKnownPlacementSource(source) || IsKnownPlacementSource(association);
    }

    private static bool IsKnownPlacementSource(string source)
    {
        return string.Equals(source, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryAppServiceSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryLayoutVmVnet, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAllowedResourceGroup(DiagramNode vnet, DiagramNode candidate, bool sameResourceGroupOnly)
    {
        return !sameResourceGroupOnly
            || string.Equals(vnet.ArmResourceGroup, candidate.ArmResourceGroup, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsVnet(DiagramNode node)
    {
        return string.Equals(node.ArmResourceType, "Microsoft.Network/virtualNetworks", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDescendantSubnet(DiagramNode candidate, string vnetArmId)
    {
        string? parentVnetId = DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId(ReadArmId(candidate));
        return !string.IsNullOrWhiteSpace(vnetArmId)
            && string.Equals(parentVnetId, vnetArmId.TrimEnd('/'), StringComparison.OrdinalIgnoreCase);
    }

    private static string ReadArmId(DiagramNode node)
    {
        return node.ArmResourceId
            ?? node.CloudResourceId?.ToString()
            ?? string.Empty;
    }
}
