using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class IntendedReachabilityPathEnumerator
{
    public static IReadOnlyList<ReachabilityPathCandidate> Enumerate(
        InventoryReachabilityPathGraphSnapshot graph,
        PrivilegePathEngineOptions options,
        SecureNowArchitectEngineRunScope? runScope = null)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(options);

        SecureNowArchitectTraversalNeighborhood? neighborhood = runScope is { IsFullEstate: false }
            ? new(graph.OutgoingEdges, graph.ResourcesByArmId, runScope.SeedCloudResourceIds, options.MaxDepth)
            : null;
        IReadOnlyDictionary<string, Guid> resourceIds = neighborhood is null
            ? new Dictionary<string, Guid>()
            : graph.ResourcesByArmId.Values
                .Where(resource => resource.CloudResourceId is Guid id && id != Guid.Empty)
                .ToDictionary(resource => resource.AzureResourceId, resource => resource.CloudResourceId!.Value,
                    StringComparer.OrdinalIgnoreCase);

        List<ReachabilityPathCandidate> results = [];
        HashSet<string> seenPathSignatures = new(StringComparer.Ordinal);

        IEnumerable<string> startNodes = graph.PublicIpArmIds
            .Concat(graph.OutgoingEdges.ContainsKey(SecureNowArchitectConstants.InternetPublicExposureNodeId)
                ? [SecureNowArchitectConstants.InternetPublicExposureNodeId]
                : [])
            .Concat(graph.PrivateIntegratedComputeArmIds);

        foreach (string startNode in startNodes.Where(node => neighborhood is null || neighborhood.CanReachSeed(node))
                     .OrderBy(static node => node, StringComparer.OrdinalIgnoreCase))
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
                seenPathSignatures, neighborhood, runScope, resourceIds,
                neighborhood?.TouchesSeed(startNode) == true);
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
        HashSet<string> seenPathSignatures,
        SecureNowArchitectTraversalNeighborhood? neighborhood,
        SecureNowArchitectEngineRunScope? runScope,
        IReadOnlyDictionary<string, Guid> resourceIds,
        bool touchedSeed)
    {
        if (path.Count >= options.MaxDepth || results.Count >= options.MaxPaths)
        {
            return;
        }

        if (TryFinalizePath(graph, path, currentNode, out ReachabilityPathCandidate? candidate))
        {
            string signature = BuildPathSignature(candidate.Hops);

            if ((runScope is null || runScope.IsFullEstate
                    || SecureNowArchitectNeighborhoodFilter.CandidateTouchesSeeds(candidate, runScope.SeedCloudResourceIds, resourceIds))
                    && seenPathSignatures.Add(signature))
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

            if (neighborhood is not null && !touchedSeed && !neighborhood.CanReachSeed(edge.ToNodeId))
                continue;

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
                seenPathSignatures, neighborhood, runScope, resourceIds,
                touchedSeed || neighborhood?.TouchesSeed(edge.ToNodeId) == true);
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

        bool hasPublicExposureHop = hops.Any(static hop =>
            hop.EdgeType is GraphEdgeTypes.Exposes
                or GraphEdgeTypes.RoutesTo
                or SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType);

        bool startsFromPrivateCompute = graph.PrivateIntegratedComputeArmIds.Contains(hops[0].FromNodeId)
            || graph.PrivateIntegratedComputeArmIds.Contains(currentNode);

        bool hasPrivatePeReachableHop = hops.Any(InventoryReachabilityPathGraph.IsPeReachablePrivateHop);

        if (!hasPublicExposureHop && !hasPrivatePeReachableHop && !startsFromPrivateCompute)
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

        if (!hasInsufficientEvidence
            && graph.DnsJoinIndex is not null
            && TryResolvePrivateComputeOrigin(hops, currentNode, graph, out string? computeArmId)
            && !string.IsNullOrWhiteSpace(computeArmId)
            && graph.DnsJoinIndex.IsMissingDnsJoin(computeArmId, currentNode))
        {
            finalHops.Add(new PrivilegePathEdge
            {
                FromNodeId = computeArmId,
                ToNodeId = currentNode,
                EdgeType = SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType,
                ProvenanceKind = ProvenanceKind.DeterministicInference,
                RoleName = null,
            });
            hasInsufficientEvidence = true;
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

    private static bool TryResolvePrivateComputeOrigin(
        IReadOnlyList<PrivilegePathEdge> hops,
        string terminalNodeId,
        InventoryReachabilityPathGraphSnapshot graph,
        out string? computeArmId)
    {
        computeArmId = null;

        if (hops.Count == 0)
        {
            return false;
        }

        string candidateOrigin = hops[0].FromNodeId;

        if (graph.PrivateIntegratedComputeArmIds.Contains(candidateOrigin))
        {
            computeArmId = candidateOrigin;

            return true;
        }

        return false;
    }
}
