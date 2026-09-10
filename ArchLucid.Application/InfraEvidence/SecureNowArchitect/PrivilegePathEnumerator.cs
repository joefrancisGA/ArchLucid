using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class PrivilegePathEnumerator
{
    public static IReadOnlyList<PrivilegePathCandidate> Enumerate(
        InventoryPrivilegePathGraphSnapshot graph,
        PrivilegePathEngineOptions options)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(options);

        List<PrivilegePathCandidate> results = [];
        HashSet<string> seenPathSignatures = new(StringComparer.Ordinal);

        IEnumerable<string> startNodes = graph.OutgoingEdges.Keys
            .Where(static nodeId => nodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal)
                || !nodeId.StartsWith("azure-ad://", StringComparison.Ordinal));

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
        InventoryPrivilegePathGraphSnapshot graph,
        PrivilegePathEngineOptions options,
        string currentNode,
        List<PrivilegePathEdge> path,
        HashSet<string> visited,
        List<PrivilegePathCandidate> results,
        HashSet<string> seenPathSignatures)
    {
        if (path.Count >= options.MaxDepth || results.Count >= options.MaxPaths)
        {
            return;
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

            if (TryFinalizePath(graph, nextPath, out PrivilegePathCandidate? candidate))
            {
                string signature = BuildPathSignature(candidate.Hops);

                if (seenPathSignatures.Add(signature))
                {
                    results.Add(candidate);
                }
            }

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
        InventoryPrivilegePathGraphSnapshot graph,
        IReadOnlyList<PrivilegePathEdge> hops,
        out PrivilegePathCandidate candidate)
    {
        candidate = null!;

        if (hops.Count == 0)
        {
            return false;
        }

        PrivilegePathEdge lastHop = hops[^1];
        bool hasHasRole = hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.HasRole);
        bool endsWithAction = lastHop.EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite;

        if (!hasHasRole && !hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity))
        {
            return false;
        }

        if (endsWithAction)
        {
            if (!hasHasRole)
            {
                return false;
            }

            string scopeNodeId = lastHop.ToNodeId;
            string? roleName = hops
                .LastOrDefault(static hop => hop.EdgeType == GraphEdgeTypes.HasRole)
                ?.RoleName;

            graph.ResourcesByArmId.TryGetValue(scopeNodeId, out AzureInventoryResourceRecord? terminalResource);

            candidate = new PrivilegePathCandidate
            {
                Hops = hops,
                TerminalScopeNodeId = scopeNodeId,
                EffectiveRoleName = roleName,
                HasInsufficientEvidenceHop = false,
                TerminalCloudResourceId = terminalResource?.CloudResourceId,
                TerminalResourceType = terminalResource?.ResourceType,
                ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                    scopeNodeId,
                    graph.ResourcesByArmId,
                    graph.TagsByResourceRowId),
                IsFederatedDeploymentPath = IsFederatedDeploymentPath(hops),
            };

            return true;
        }

        PrivilegePathEdge? hasRoleHop = hops.LastOrDefault(static hop => hop.EdgeType == GraphEdgeTypes.HasRole);

        if (hasRoleHop is null)
        {
            return false;
        }

        string? mappedRole = hasRoleHop.RoleName;
        AzureInventoryDerivedDataPlanePermission permission = AzureInventoryRbacDataPlaneRoleMap.Resolve(mappedRole);

        if (permission != AzureInventoryDerivedDataPlanePermission.None)
        {
            return TryFinalizeMappedRolePath(graph, hops, hasRoleHop, mappedRole, permission, out candidate);
        }

        List<PrivilegePathEdge> hopsWithInsufficient = [.. hops];
        hopsWithInsufficient.Add(new PrivilegePathEdge
        {
            FromNodeId = hasRoleHop.ToNodeId,
            ToNodeId = hasRoleHop.ToNodeId,
            EdgeType = "unknown-role-actions",
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            RoleName = mappedRole,
        });

        graph.ResourcesByArmId.TryGetValue(hasRoleHop.ToNodeId, out AzureInventoryResourceRecord? scopeResource);

        candidate = new PrivilegePathCandidate
        {
            Hops = hopsWithInsufficient,
            TerminalScopeNodeId = hasRoleHop.ToNodeId,
            EffectiveRoleName = mappedRole,
            HasInsufficientEvidenceHop = true,
            TerminalCloudResourceId = scopeResource?.CloudResourceId,
            TerminalResourceType = scopeResource?.ResourceType,
            ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                hasRoleHop.ToNodeId,
                graph.ResourcesByArmId,
                graph.TagsByResourceRowId),
            IsFederatedDeploymentPath = IsFederatedDeploymentPath(hopsWithInsufficient),
        };

        return true;
    }

    private static bool TryFinalizeMappedRolePath(
        InventoryPrivilegePathGraphSnapshot graph,
        IReadOnlyList<PrivilegePathEdge> hops,
        PrivilegePathEdge hasRoleHop,
        string? mappedRole,
        AzureInventoryDerivedDataPlanePermission permission,
        out PrivilegePathCandidate candidate)
    {
        candidate = null!;

        string actionEdgeType = permission is AzureInventoryDerivedDataPlanePermission.Write
            or AzureInventoryDerivedDataPlanePermission.ReadAndWrite
            ? GraphEdgeTypes.CanWrite
            : GraphEdgeTypes.CanRead;

        List<PrivilegePathEdge> hopsWithAction = [.. hops];
        hopsWithAction.Add(new PrivilegePathEdge
        {
            FromNodeId = hasRoleHop.FromNodeId,
            ToNodeId = hasRoleHop.ToNodeId,
            EdgeType = actionEdgeType,
            ProvenanceKind = ProvenanceKind.DerivedFact,
            RoleName = mappedRole,
        });

        graph.ResourcesByArmId.TryGetValue(hasRoleHop.ToNodeId, out AzureInventoryResourceRecord? scopeResource);

        candidate = new PrivilegePathCandidate
        {
            Hops = hopsWithAction,
            TerminalScopeNodeId = hasRoleHop.ToNodeId,
            EffectiveRoleName = mappedRole,
            HasInsufficientEvidenceHop = false,
            TerminalCloudResourceId = scopeResource?.CloudResourceId,
            TerminalResourceType = scopeResource?.ResourceType,
            ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                hasRoleHop.ToNodeId,
                graph.ResourcesByArmId,
                graph.TagsByResourceRowId),
            IsFederatedDeploymentPath = IsFederatedDeploymentPath(hopsWithAction),
        };

        return true;
    }

    private static string BuildPathSignature(IReadOnlyList<PrivilegePathEdge> hops) =>
        string.Join(
            ">",
            hops.Select(static hop => $"{hop.FromNodeId}|{hop.EdgeType}|{hop.ToNodeId}"));

    private static bool IsFederatedDeploymentPath(IReadOnlyList<PrivilegePathEdge> hops) =>
        hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.FederatesAs);
}
