using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class IntendedReachabilityPathEnumerator
{
    public static IReadOnlyList<ReachabilityPathCandidate> Enumerate(
        InventoryReachabilityPathGraphSnapshot graph,
        PrivilegePathEngineOptions options,
        SecureNowArchitectEngineRunScope? runScope = null) =>
        EnumerateWithLimits(graph, options, runScope).Candidates;

    internal static ReachabilityPathEnumerationResult EnumerateWithLimits(
        InventoryReachabilityPathGraphSnapshot graph,
        PrivilegePathEngineOptions options,
        SecureNowArchitectEngineRunScope? runScope = null)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(options);
        SecurityEvidencePathSearchLimitTracker limits = new();

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
                limits.RecordMaxPaths();
                break;
            }

            List<PrivilegePathEdge> pathBuffer = [];
            HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase) { startNode };
            DepthFirstSearch(
                graph,
                options,
                startNode,
                pathBuffer,
                visited,
                results,
                seenPathSignatures, neighborhood, runScope, resourceIds,
                neighborhood?.TouchesSeed(startNode) == true,
                limits);
        }

        limits.SetPathsEmitted(results.Count);

        return new ReachabilityPathEnumerationResult
        {
            Candidates = results,
            LimitHits = limits.ToHits(options),
        };
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
        bool touchedSeed,
        SecurityEvidencePathSearchLimitTracker limits)
    {
        if (SecurityEvidencePathSearchLimitGuard.StopForDepth(
                limits,
                options,
                path.Count,
                graph.OutgoingEdges,
                currentNode,
                visited)
            || SecurityEvidencePathSearchLimitGuard.StopForPathCap(
                limits,
                options,
                results.Count,
                graph.OutgoingEdges.TryGetValue(currentNode, out List<PrivilegePathEdge>? cappedEdges)
                    ? cappedEdges
                    : [],
                visited))
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

        foreach (PrivilegePathEdge edge in edges)
        {
            if (SecurityEvidencePathSearchLimitGuard.StopForFanOut(
                    limits,
                    options,
                    fanOut,
                    edges,
                    visited)
                || SecurityEvidencePathSearchLimitGuard.StopForPathCap(
                    limits,
                    options,
                    results.Count,
                    edges,
                    visited))
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
            path.Add(edge);
            visited.Add(edge.ToNodeId);

            DepthFirstSearch(
                graph,
                options,
                edge.ToNodeId,
                path,
                visited,
                results,
                seenPathSignatures, neighborhood, runScope, resourceIds,
                touchedSeed || neighborhood?.TouchesSeed(edge.ToNodeId) == true,
                limits);

            path.RemoveAt(path.Count - 1);
            visited.Remove(edge.ToNodeId);
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

        if (!hasInsufficientEvidence
            && graph.CustomDnsIndex is not null
            && graph.DnsJoinIndex is not null
            && TryResolvePrivateComputeOrigin(hops, currentNode, graph, out string? computeForDns)
            && !string.IsNullOrWhiteSpace(computeForDns)
            && graph.DnsJoinIndex.ComputeToVnetArmId.TryGetValue(
                ArmResourceIdNormalizer.Normalize(computeForDns),
                out string? computeVnetArmId)
            && graph.CustomDnsIndex.VnetUsesCustomDns(computeVnetArmId)
            && (hasPrivatePeReachableHop || startsFromPrivateCompute))
        {
            finalHops.Add(new PrivilegePathEdge
            {
                FromNodeId = computeForDns,
                ToNodeId = currentNode,
                EdgeType = SecureNowArchitectConstants.InsufficientEvidenceCustomDnsResolverHopEdgeType,
                ProvenanceKind = ProvenanceKind.DeterministicInference,
                RoleName = null,
            });
            hasInsufficientEvidence = true;
        }

        if (!hasInsufficientEvidence
            && graph.EdgeControlIndex is not null)
        {
            NetworkEdgeControlHopResult edgeControlResult = TryApplyNetworkEdgeControlHops(
                graph,
                finalHops,
                hasPublicExposureHop,
                currentNode);

            if (edgeControlResult == NetworkEdgeControlHopResult.PathDenied)
            {
                return false;
            }

            if (edgeControlResult == NetworkEdgeControlHopResult.InsufficientAdded)
            {
                hasInsufficientEvidence = true;
            }
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

    private enum NetworkEdgeControlHopResult
    {
        NotApplied = 0,
        InsufficientAdded = 1,
        AllowedAdded = 2,
        PathDenied = 3,
    }

    private static NetworkEdgeControlHopResult TryApplyNetworkEdgeControlHops(
        InventoryReachabilityPathGraphSnapshot graph,
        List<PrivilegePathEdge> finalHops,
        bool hasPublicExposureHop,
        string terminalAssetNodeId)
    {
        AzureInventoryReachabilityEdgeControlIndex edgeControlIndex = graph.EdgeControlIndex!;

        foreach (string subnetNode in finalHops
                     .SelectMany(static hop => new[] { hop.FromNodeId, hop.ToNodeId })
                     .Where(InventoryReachabilityPathGraph.IsSubnetNode)
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (graph.SubnetToFirewallArmId.ContainsKey(ArmResourceIdNormalizer.Normalize(subnetNode)))
            {
                AzureInventoryNetworkEdgeControlDecision firewallDecision =
                    AzureInventoryReachabilityEdgeControlEvaluator.EvaluateSubnetFirewallRoute(
                        subnetNode,
                        graph.ReachabilityResourcesByArmId,
                        graph.SubnetToFirewallArmId);

                if (firewallDecision == AzureInventoryNetworkEdgeControlDecision.Deny)
                {
                    return NetworkEdgeControlHopResult.PathDenied;
                }

                if (firewallDecision == AzureInventoryNetworkEdgeControlDecision.Allow)
                {
                    AppendAllowedEdgeControlHop(finalHops, subnetNode, terminalAssetNodeId);

                    return NetworkEdgeControlHopResult.AllowedAdded;
                }

                AppendInsufficientEdgeControlHop(finalHops, subnetNode, terminalAssetNodeId);

                return NetworkEdgeControlHopResult.InsufficientAdded;
            }

            if (edgeControlIndex.SubnetRequiresEdgeControlEvidence(subnetNode))
            {
                AppendInsufficientEdgeControlHop(finalHops, subnetNode, terminalAssetNodeId);

                return NetworkEdgeControlHopResult.InsufficientAdded;
            }
        }

        if (!hasPublicExposureHop)
        {
            return NetworkEdgeControlHopResult.NotApplied;
        }

        bool traversesEdgeAppliance = finalHops.Any(hop =>
            InventoryReachabilityPathGraph.IsEdgeApplianceNode(hop.FromNodeId, graph.ResourcesByArmId)
            || InventoryReachabilityPathGraph.IsEdgeApplianceNode(hop.ToNodeId, graph.ResourcesByArmId));

        if (traversesEdgeAppliance)
        {
            return NetworkEdgeControlHopResult.NotApplied;
        }

        if (edgeControlIndex.TryGetApplicationGatewayForBackend(
                terminalAssetNodeId,
                out string applicationGatewayArmId)
            && graph.ReachabilityResourcesByArmId.TryGetValue(
                applicationGatewayArmId,
                out AzureInventoryReachabilityResourceProperties? applicationGatewayResource))
        {
            AzureInventoryNetworkEdgeControlDecision agwDecision =
                AzureInventoryReachabilityEdgeControlEvaluator.EvaluateApplicationGateway(
                    applicationGatewayResource.Properties,
                    terminalAssetNodeId);

            if (agwDecision == AzureInventoryNetworkEdgeControlDecision.Deny)
            {
                return NetworkEdgeControlHopResult.PathDenied;
            }

            if (agwDecision == AzureInventoryNetworkEdgeControlDecision.Allow)
            {
                AppendAllowedEdgeControlHop(finalHops, applicationGatewayArmId, terminalAssetNodeId);

                return NetworkEdgeControlHopResult.AllowedAdded;
            }

            AppendInsufficientEdgeControlHop(finalHops, terminalAssetNodeId, terminalAssetNodeId);

            return NetworkEdgeControlHopResult.InsufficientAdded;
        }

        if (edgeControlIndex.TryGetFrontDoorForBackend(terminalAssetNodeId, out string frontDoorArmId)
            && graph.ReachabilityResourcesByArmId.TryGetValue(
                frontDoorArmId,
                out AzureInventoryReachabilityResourceProperties? frontDoorResource))
        {
            AzureInventoryNetworkEdgeControlDecision frontDoorDecision =
                AzureInventoryReachabilityEdgeControlEvaluator.EvaluateFrontDoor(
                    frontDoorResource.Properties,
                    terminalAssetNodeId);

            if (frontDoorDecision == AzureInventoryNetworkEdgeControlDecision.Deny)
            {
                return NetworkEdgeControlHopResult.PathDenied;
            }

            if (frontDoorDecision == AzureInventoryNetworkEdgeControlDecision.Allow)
            {
                AppendAllowedEdgeControlHop(finalHops, frontDoorArmId, terminalAssetNodeId);

                return NetworkEdgeControlHopResult.AllowedAdded;
            }

            AppendInsufficientEdgeControlHop(finalHops, terminalAssetNodeId, terminalAssetNodeId);

            return NetworkEdgeControlHopResult.InsufficientAdded;
        }

        if (edgeControlIndex.AssetDeclaredBehindApplicationGateway(terminalAssetNodeId)
            || edgeControlIndex.AssetDeclaredBehindFrontDoor(terminalAssetNodeId))
        {
            AppendInsufficientEdgeControlHop(finalHops, terminalAssetNodeId, terminalAssetNodeId);

            return NetworkEdgeControlHopResult.InsufficientAdded;
        }

        return NetworkEdgeControlHopResult.NotApplied;
    }

    private static void AppendInsufficientEdgeControlHop(
        List<PrivilegePathEdge> finalHops,
        string fromNodeId,
        string toNodeId)
    {
        finalHops.Add(new PrivilegePathEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType,
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            RoleName = null,
        });
    }

    private static void AppendAllowedEdgeControlHop(
        List<PrivilegePathEdge> finalHops,
        string fromNodeId,
        string toNodeId)
    {
        finalHops.Add(new PrivilegePathEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = SecureNowArchitectConstants.NetworkEdgeControlAllowedHopEdgeType,
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            RoleName = AzureInventoryReachabilityEdgeControlEvaluator.AllowedHopRoleName,
        });
    }
}
