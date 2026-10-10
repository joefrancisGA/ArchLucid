using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Collapses ADF external linked-service nodes that share a host and remaps hosts onto snapshot resources.
/// </summary>
internal static class AzureInventorySnapshotExternalSourceHostConsolidator
{
    public static void Consolidate(
        AzureInventorySnapshotDetailReadModel snapshot,
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(seenNodeIds);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<Guid, IReadOnlyDictionary<string, string>> propertiesByResourceRowId = snapshot.Properties
            .Where(property => !string.IsNullOrWhiteSpace(property.PropertyKey)
                && !string.IsNullOrWhiteSpace(property.PropertyValue))
            .GroupBy(property => property.ResourceRowId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyDictionary<string, string>)group
                    .GroupBy(property => property.PropertyKey, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        keyGroup => keyGroup.Key,
                        keyGroup => keyGroup.Last().PropertyValue!,
                        StringComparer.OrdinalIgnoreCase));
        List<AzureExtractorExtendedResourceRow> extendedResources = snapshot.Resources
            .Select(resource => new AzureExtractorExtendedResourceRow
            {
                AzureResourceId = resource.AzureResourceId,
                ResourceType = resource.ResourceType,
                Name = ReadResourceName(resource.AzureResourceId),
                Properties = propertiesByResourceRowId.GetValueOrDefault(resource.ResourceRowId)
                    ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            })
            .ToList();

        Dictionary<string, string> hostToArmId =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(extendedResources);

        RemapExternalNodesToSnapshotResources(nodes, seenNodeIds, nodeIdByArmId, edges, edgeKeys, hostToArmId);
        CollapseExternalNodesBySharedHost(nodes, seenNodeIds, nodeIdByArmId, edges, edgeKeys);
    }

    private static void RemapExternalNodesToSnapshotResources(
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        IReadOnlyDictionary<string, string> hostToArmId)
    {
        List<GraphNode> externalNodes = nodes
            .Where(node => AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(node.NodeId))
            .ToList();

        foreach (GraphNode externalNode in externalNodes)
        {
            if (!TryReadTargetHost(externalNode, out string host))
            {
                continue;
            }

            if (!hostToArmId.TryGetValue(host, out string? matchedArmId)
                || !nodeIdByArmId.TryGetValue(matchedArmId, out string? targetNodeId))
            {
                continue;
            }

            RemapNodeId(externalNode.NodeId, targetNodeId, edges, edgeKeys);
            RemoveNode(nodes, seenNodeIds, nodeIdByArmId, externalNode);
        }
    }

    private static void CollapseExternalNodesBySharedHost(
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        List<GraphNode> externalNodes = nodes
            .Where(node => AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(node.NodeId))
            .ToList();

        foreach (IGrouping<HostRollupKey, GraphNode> group in externalNodes
                     .Where(node => TryReadTargetHost(node, out _))
                     .GroupBy(
                         node => new HostRollupKey(
                             ReadLinkedServiceType(node),
                             ReadTargetHost(node)!),
                         HostRollupKeyComparer.Instance))
        {
            List<GraphNode> members = group.ToList();

            if (members.Count < 2)
            {
                continue;
            }

            string host = group.Key.Host;
            string linkedServiceType = group.Key.LinkedServiceType;
            string rollupNodeKey = AzureInventoryAdfExternalSourceNodeFactory.BuildHostRollupNodeKey(
                linkedServiceType,
                host);
            List<string> linkedServiceNames = members
                .Select(ReadLinkedServiceName)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            string title = linkedServiceNames.Count == 1
                ? linkedServiceNames[0]
                : host;
            List<string> factoryNames = members
                .Select(ReadFactoryName)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToList();

            GraphNode rollupNode = AzureInventoryAdfExternalSourceNodeFactory.CreateGraphNode(
                rollupNodeKey,
                title,
                linkedServiceType,
                host);
            rollupNode.Properties[AzureInventoryAdfExternalSourceNodeFactory.ExternalFactoryNamesPropertyKey] =
                string.Join(';', factoryNames);

            if (seenNodeIds.Add(rollupNode.NodeId))
            {
                nodes.Add(rollupNode);
            }

            nodeIdByArmId[rollupNodeKey] = rollupNode.NodeId;

            foreach (GraphNode member in members)
            {
                RemapNodeId(member.NodeId, rollupNode.NodeId, edges, edgeKeys);
                RemoveNode(nodes, seenNodeIds, nodeIdByArmId, member);
            }
        }
    }

    private static void RemapNodeId(
        string fromNodeId,
        string toNodeId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
        {
            return;
        }

        foreach (GraphEdge edge in edges)
        {
            if (string.Equals(edge.FromNodeId, fromNodeId, StringComparison.Ordinal))
            {
                edge.FromNodeId = toNodeId;
            }

            if (string.Equals(edge.ToNodeId, fromNodeId, StringComparison.Ordinal))
            {
                edge.ToNodeId = toNodeId;
            }
        }

        DeduplicateEdges(edges, edgeKeys);
    }

    private static void DeduplicateEdges(List<GraphEdge> edges, HashSet<string> edgeKeys)
    {
        edgeKeys.Clear();
        List<GraphEdge> uniqueEdges = [];

        foreach (GraphEdge edge in edges)
        {
            string edgeKey = $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}";

            if (!edgeKeys.Add(edgeKey))
            {
                continue;
            }

            uniqueEdges.Add(edge);
        }

        edges.Clear();
        edges.AddRange(uniqueEdges);
    }

    private static void RemoveNode(
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId,
        GraphNode node)
    {
        nodes.RemoveAll(candidate => string.Equals(candidate.NodeId, node.NodeId, StringComparison.Ordinal));
        seenNodeIds.Remove(node.NodeId);

        if (node.Properties.TryGetValue("arm.id", out string? armId)
            && !string.IsNullOrWhiteSpace(armId))
        {
            nodeIdByArmId.Remove(ArmResourceIdNormalizer.Normalize(armId));
        }
    }

    private static bool TryReadTargetHost(GraphNode node, out string host)
    {
        host = string.Empty;

        if (node.Properties.TryGetValue(
                AzureInventoryAdfExternalSourceNodeFactory.ExternalHostInKeyVaultPropertyKey,
                out string? hostInKeyVault)
            && string.Equals(hostInKeyVault, "true", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!node.Properties.TryGetValue(
                AzureInventoryAdfExternalSourceNodeFactory.ExternalTargetHostPropertyKey,
                out string? rawHost)
            || string.IsNullOrWhiteSpace(rawHost))
        {
            return false;
        }

        host = rawHost.Trim().ToLowerInvariant();

        return host.Length > 0;
    }

    private static string ReadLinkedServiceType(GraphNode node)
    {
        return node.Properties.TryGetValue(
            AzureInventoryAdfExternalSourceNodeFactory.ExternalLinkedServiceTypePropertyKey,
            out string? linkedServiceType)
            && !string.IsNullOrWhiteSpace(linkedServiceType)
            ? linkedServiceType.Trim()
            : "external";
    }

    private static string ReadLinkedServiceName(GraphNode node)
    {
        if (!AzureInventoryAdfExternalSourceNodeFactory.TryParseNodeKey(node.NodeId, out _, out string linkedServiceName))
        {
            return node.Label;
        }

        return linkedServiceName;
    }

    private static string ReadTargetHost(GraphNode node)
    {
        return node.Properties.TryGetValue(
            AzureInventoryAdfExternalSourceNodeFactory.ExternalTargetHostPropertyKey,
            out string? host)
            && !string.IsNullOrWhiteSpace(host)
            ? host.Trim().ToLowerInvariant()
            : string.Empty;
    }

    private static string ReadFactoryName(GraphNode node)
    {
        if (node.Properties.TryGetValue(
                AzureInventoryAdfExternalSourceNodeFactory.ExternalFactoryNamePropertyKey,
                out string? factoryName)
            && !string.IsNullOrWhiteSpace(factoryName))
        {
            return factoryName.Trim();
        }

        if (AzureInventoryAdfExternalSourceNodeFactory.TryParseNodeKey(node.NodeId, out string factoryResourceId, out _))
        {
            return ReadResourceName(factoryResourceId);
        }

        return string.Empty;
    }

    private static string ReadResourceName(string? armResourceId)
    {
        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return string.Empty;
        }

        int separator = armResourceId.LastIndexOf('/');

        return separator >= 0 && separator < armResourceId.Length - 1
            ? armResourceId[(separator + 1)..]
            : armResourceId;
    }

    private sealed record HostRollupKey(string LinkedServiceType, string Host);

    private sealed class HostRollupKeyComparer : IEqualityComparer<HostRollupKey>
    {
        public static readonly HostRollupKeyComparer Instance = new();

        public bool Equals(HostRollupKey? x, HostRollupKey? y)
        {
            if (x is null || y is null)
            {
                return ReferenceEquals(x, y);
            }

            return string.Equals(x.LinkedServiceType, y.LinkedServiceType, StringComparison.OrdinalIgnoreCase)
                && string.Equals(x.Host, y.Host, StringComparison.OrdinalIgnoreCase);
        }

        public int GetHashCode(HostRollupKey obj)
        {
            return HashCode.Combine(
                obj.LinkedServiceType.ToLowerInvariant(),
                obj.Host.ToLowerInvariant());
        }
    }
}
