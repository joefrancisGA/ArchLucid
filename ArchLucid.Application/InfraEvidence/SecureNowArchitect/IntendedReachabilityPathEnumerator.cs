using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class IntendedReachabilityPathEnumerator
{
    public static IReadOnlyList<ReachabilityPathCandidate> Enumerate(
        InventoryReachabilityPathGraphSnapshot graph,
        PrivilegePathEngineOptions options)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(options);

        List<ReachabilityPathCandidate> results = [];
        HashSet<string> seenPathSignatures = new(StringComparer.Ordinal);

        IEnumerable<string> startNodes = graph.PublicIpArmIds
            .Concat(graph.OutgoingEdges.ContainsKey(SecureNowArchitectConstants.InternetPublicExposureNodeId)
                ? [SecureNowArchitectConstants.InternetPublicExposureNodeId]
                : []);

        foreach (string startNode in startNodes.OrderBy(static node => node, StringComparer.OrdinalIgnoreCase))
        {
            if (results.Count >= options.MaxPaths)
            {
                break;
            }

            DepthFirstSearch(
                graph,
                options,
                startNode,
                [],
                new HashSet<string>(StringComparer.OrdinalIgnoreCase) { startNode },
                results,
                seenPathSignatures);
        }

        return results;
    }

    private static void DepthFirstSearch(
        InventoryReachabilityPathGraphSnapshot graph,
        PrivilegePathEngineOptions options,
        string currentNode,
        List<PrivilegePathEdge> path,
        HashSet<string> visited,
        List<ReachabilityPathCandidate> results,
        HashSet<string> seenPathSignatures)
    {
        if (path.Count >= options.MaxDepth || results.Count >= options.MaxPaths)
        {
            return;
        }

        if (TryFinalizePath(graph, path, currentNode, out ReachabilityPathCandidate? candidate))
        {
            string signature = BuildPathSignature(candidate.Hops);

            if (seenPathSignatures.Add(signature))
            {
                results.Add(candidate);
            }
        }

        if (!graph.OutgoingEdges.TryGetValue(currentNode, out List<PrivilegePathEdge>? edges))
        {
            return;
        }

        int fanOut = 0;

        foreach (PrivilegePathEdge edge in edges.OrderBy(static candidate => candidate.EdgeType, StringComparer.Ordinal))
        {
            if (fanOut >= options.MaxFanOutPerNode)
            {
                break;
            }

            if (visited.Contains(edge.ToNodeId))
            {
                continue;
            }

            fanOut++;
            List<PrivilegePathEdge> nextPath = [.. path, edge];
            HashSet<string> nextVisited = [.. visited, edge.ToNodeId];

            DepthFirstSearch(
                graph,
                options,
                edge.ToNodeId,
                nextPath,
                nextVisited,
                results,
                seenPathSignatures);
        }
    }

    private static bool TryFinalizePath(
        InventoryReachabilityPathGraphSnapshot graph,
        IReadOnlyList<PrivilegePathEdge> hops,
        string currentNode,
        out ReachabilityPathCandidate candidate)
    {
        candidate = null!;

        if (hops.Count == 0)
        {
            return false;
        }

        if (!graph.ResourcesByArmId.TryGetValue(currentNode, out AzureInventoryResourceRecord? terminalResource))
        {
            return false;
        }

        if (!InventoryReachabilityPathGraph.IsReachabilityAsset(terminalResource.ResourceType))
        {
            return false;
        }

        if (graph.PrivateEndpointOnlyArmIds.Contains(currentNode)
            && !hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.Exposes
                || hop.EdgeType == SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType
                || hop.EdgeType == GraphEdgeTypes.RoutesTo))
        {
            return false;
        }

        bool hasExposureHop = hops.Any(static hop =>
            hop.EdgeType is GraphEdgeTypes.Exposes
                or GraphEdgeTypes.RoutesTo
                or SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType);

        if (!hasExposureHop)
        {
            return false;
        }

        List<PrivilegePathEdge> finalHops = [.. hops];
        bool hasInsufficientEvidence = false;

        IEnumerable<string> subnetsInPath = finalHops
            .SelectMany(static hop => new[] { hop.FromNodeId, hop.ToNodeId })
            .Where(InventoryReachabilityPathGraph.IsSubnetNode)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        foreach (string subnetNode in subnetsInPath)
        {
            if (graph.SubnetsWithNsgAllowRule.Contains(subnetNode))
            {
                continue;
            }

            if (finalHops.Any(hop =>
                    hop.EdgeType == GraphEdgeTypes.RoutesTo
                    && hop.FromNodeId.Equals(subnetNode, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            finalHops.Add(new PrivilegePathEdge
            {
                FromNodeId = subnetNode,
                ToNodeId = subnetNode,
                EdgeType = SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType,
                ProvenanceKind = ProvenanceKind.DeterministicInference,
                RoleName = null,
            });
            hasInsufficientEvidence = true;
            break;
        }

        candidate = new ReachabilityPathCandidate
        {
            Hops = finalHops,
            TerminalAssetNodeId = currentNode,
            HasInsufficientEvidenceHop = hasInsufficientEvidence,
            TerminalCloudResourceId = terminalResource.CloudResourceId,
            TerminalResourceType = terminalResource.ResourceType,
            ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                currentNode,
                graph.ResourcesByArmId,
                graph.TagsByResourceRowId),
        };

        return true;
    }

    private static string BuildPathSignature(IReadOnlyList<PrivilegePathEdge> hops) =>
        string.Join(
            ">",
            hops.Select(static hop => $"{hop.FromNodeId}|{hop.EdgeType}|{hop.ToNodeId}"));
}
