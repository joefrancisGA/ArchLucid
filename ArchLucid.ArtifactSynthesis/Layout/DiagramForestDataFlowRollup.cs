using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Collapses repeated, same-neighbor cards for the data-flow canvas only.</summary>
internal static class DiagramForestDataFlowRollup
{
    private const int MinimumMembersToRollUp = 4;

    internal sealed record Result(
        IReadOnlyList<DiagramNode> Nodes,
        IReadOnlyList<DiagramEdge> Edges);

    public static Result Apply(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        HashSet<string> nodeIds = nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, HashSet<string>> neighborIdsByNodeId = BuildNeighborIds(nodes, edges, nodeIds);
        List<DiagramNode> rollupNodes = [];
        Dictionary<string, DiagramNode> rollupByMemberId = new(StringComparer.Ordinal);
        Dictionary<string, DiagramNode> rollupByFirstMemberId = new(StringComparer.Ordinal);
        int rollupOrdinal = 0;

        foreach (IGrouping<RollupKey, DiagramNode> group in nodes
                     .GroupBy(node => BuildKey(node, neighborIdsByNodeId), RollupKeyComparer.Instance))
        {
            List<DiagramNode> members = group.ToList();
            if (members.Count < MinimumMembersToRollUp)
            {
                continue;
            }

            DiagramNode rollup = CreateRollupNode(
                members,
                neighborIdsByNodeId,
                ++rollupOrdinal);
            rollupNodes.Add(rollup);
            rollupByFirstMemberId[members[0].NodeId] = rollup;

            foreach (DiagramNode member in members)
            {
                rollupByMemberId[member.NodeId] = rollup;
            }
        }

        if (rollupNodes.Count == 0)
        {
            return new Result(nodes, edges);
        }

        List<DiagramNode> resolvedNodes = [];
        HashSet<string> emittedRollupIds = new(StringComparer.Ordinal);
        foreach (DiagramNode node in nodes)
        {
            if (!rollupByMemberId.TryGetValue(node.NodeId, out DiagramNode? rollup))
            {
                resolvedNodes.Add(node);
                continue;
            }

            if (emittedRollupIds.Add(rollup.NodeId))
            {
                resolvedNodes.Add(rollup);
            }
        }

        List<DiagramEdge> resolvedEdges = [];
        HashSet<string> emittedEdgeKeys = new(StringComparer.Ordinal);
        foreach (DiagramEdge edge in edges)
        {
            string fromNodeId = ResolveNodeId(edge.FromNodeId, rollupByMemberId);
            string toNodeId = ResolveNodeId(edge.ToNodeId, rollupByMemberId);
            if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            string edgeKey = $"{fromNodeId}\u001f{toNodeId}\u001f{edge.Label}\u001f{edge.IsLayoutOnly}";
            if (!emittedEdgeKeys.Add(edgeKey))
            {
                continue;
            }

            resolvedEdges.Add(CloneEdge(edge, fromNodeId, toNodeId));
        }

        return new Result(resolvedNodes, resolvedEdges);
    }

    private static Dictionary<string, HashSet<string>> BuildNeighborIds(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges,
        IReadOnlySet<string> nodeIds)
    {
        Dictionary<string, HashSet<string>> neighbors = nodes.ToDictionary(
            node => node.NodeId,
            _ => new HashSet<string>(StringComparer.Ordinal),
            StringComparer.Ordinal);

        foreach (DiagramEdge edge in edges)
        {
            if (edge.IsLayoutOnly
                || !nodeIds.Contains(edge.FromNodeId)
                || !nodeIds.Contains(edge.ToNodeId)
                || string.Equals(edge.FromNodeId, edge.ToNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            neighbors[edge.FromNodeId].Add(edge.ToNodeId);
            neighbors[edge.ToNodeId].Add(edge.FromNodeId);
        }

        return neighbors;
    }

    private static RollupKey BuildKey(
        DiagramNode node,
        IReadOnlyDictionary<string, HashSet<string>> neighborIdsByNodeId)
    {
        string type = !string.IsNullOrWhiteSpace(node.ExternalLinkedServiceType)
            ? node.ExternalLinkedServiceType.Trim()
            : node.ArmResourceType?.Trim() ?? string.Empty;
        string neighbors = string.Join(
            "\u001e",
            neighborIdsByNodeId[node.NodeId].OrderBy(value => value, StringComparer.Ordinal));
        return new RollupKey(node.SubgraphId ?? string.Empty, type, neighbors);
    }

    private static DiagramNode CreateRollupNode(
        IReadOnlyList<DiagramNode> members,
        IReadOnlyDictionary<string, HashSet<string>> neighborIdsByNodeId,
        int ordinal)
    {
        DiagramNode first = members[0];
        string typeCaption = DiagramNodeHumanCaptionFactory.TryFormatDataFlowTypeCaption(first)
            ?? "resource";
        string title = $"{members.Count} {PluralizeTypeCaption(typeCaption)}";
        int used = members.Count(member => neighborIdsByNodeId[member.NodeId].Count > 0);
        string? statusLine = IsConsumerStatusResource(first.ArmResourceType)
            ? $"{used} used · {members.Count - used} no consumer found"
            : null;
        List<string> factoryNames = members
            .SelectMany(member => member.ExternalFactoryNames)
            .Concat(
                members
                    .Select(member => member.ExternalFactoryName)
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Select(name => name!.Trim()))
            .Where(name => name.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new DiagramNode
        {
            NodeId = $"{first.NodeId}-rollup-{ordinal}",
            Label = title,
            NodeType = first.NodeType,
            SubgraphId = first.SubgraphId,
            OrderKey = members.Min(member => member.OrderKey),
            ArmResourceType = first.ArmResourceType,
            ArmResourceKind = first.ArmResourceKind,
            ExternalLinkedServiceType = first.ExternalLinkedServiceType,
            ExternalFactoryName = factoryNames.Count == 1 ? factoryNames[0] : null,
            ExternalFactoryNames = factoryNames,
            ExternalTargetHost = first.ExternalTargetHost,
            ExternalIntegrationRuntime = first.ExternalIntegrationRuntime,
            ExternalHostInKeyVault = first.ExternalHostInKeyVault,
            ArmResourceGroup = first.ArmResourceGroup,
            IncludeResourceGroupInCaption = false,
            HasPrivateEndpointAccess = members.Any(member => member.HasPrivateEndpointAccess),
            IsDataFlowRollup = true,
            DataFlowRollupOrdinal = ordinal,
            DataFlowRollupMemberIds = members.Select(member => member.NodeId).ToList(),
            DataFlowRollupMemberNames = members.Select(BuildMemberName).ToList(),
            DataFlowRollupStatusLine = statusLine,
            ParentAttachmentDetails = [],
            UnresolvedRelationshipDetails = [],
            DataFlowTraversalHopEvidenceDetails = [],
            NsgInboundRuleChips = [],
        };
    }

    private static string BuildMemberName(DiagramNode member)
    {
        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(member);
        string status = IsConsumerStatusResource(member.ArmResourceType)
            ? "No consumer found"
            : string.Empty;
        string resourceGroup = string.IsNullOrWhiteSpace(member.ArmResourceGroup)
            ? string.Empty
            : member.ArmResourceGroup.Trim();
        return string.Join(
            " · ",
            new[] { caption.ResourceName, resourceGroup, status }
                .Where(value => value.Length > 0));
    }

    private static string PluralizeTypeCaption(string caption)
    {
        return caption switch
        {
            "Storage account" => "storage accounts",
            "Function App" => "Function Apps",
            "App Service" => "App Services",
            "Logic App connection" => "Logic App connections",
            _ when caption.EndsWith('s') => $"{caption}",
            _ => $"{caption}s",
        };
    }

    private static bool IsConsumerStatusResource(string? armResourceType)
    {
        return armResourceType is not null
            && (armResourceType.Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Sql/servers/databases", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Sql/managedInstances", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforMySQL/servers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforMySQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforPostgreSQL/servers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforPostgreSQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DocumentDB/databaseAccounts", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Cache/Redis", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Cache/redis", StringComparison.OrdinalIgnoreCase));
    }

    private static string ResolveNodeId(
        string nodeId,
        IReadOnlyDictionary<string, DiagramNode> rollupByMemberId)
    {
        return rollupByMemberId.TryGetValue(nodeId, out DiagramNode? rollup)
            ? rollup.NodeId
            : nodeId;
    }

    private static DiagramEdge CloneEdge(DiagramEdge source, string fromNodeId, string toNodeId)
    {
        return new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = source.Label,
            IsLayoutOnly = source.IsLayoutOnly,
            ProvenanceKind = source.ProvenanceKind,
            InferenceSource = source.InferenceSource,
            DeclaredConnectionId = source.DeclaredConnectionId,
            IsDataFlowNsgBlocked = source.IsDataFlowNsgBlocked,
            DataFlowNsgAnnotationLabels = [.. source.DataFlowNsgAnnotationLabels],
            DataFlowNsgSupportingRuleDetails = [.. source.DataFlowNsgSupportingRuleDetails],
        };
    }

    private sealed record RollupKey(string Stage, string Type, string Neighbors);

    private sealed class RollupKeyComparer : IEqualityComparer<RollupKey>
    {
        public static RollupKeyComparer Instance { get; } = new();

        public bool Equals(RollupKey? x, RollupKey? y)
        {
            return x is not null
                && y is not null
                && string.Equals(x.Stage, y.Stage, StringComparison.Ordinal)
                && string.Equals(x.Type, y.Type, StringComparison.OrdinalIgnoreCase)
                && string.Equals(x.Neighbors, y.Neighbors, StringComparison.Ordinal);
        }

        public int GetHashCode(RollupKey obj)
        {
            return HashCode.Combine(
                StringComparer.Ordinal.GetHashCode(obj.Stage),
                StringComparer.OrdinalIgnoreCase.GetHashCode(obj.Type),
                StringComparer.Ordinal.GetHashCode(obj.Neighbors));
        }
    }
}
