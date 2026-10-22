using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class PrivilegePathEnumerator
{
    public static IReadOnlyList<PrivilegePathCandidate> Enumerate(
        InventoryPrivilegePathGraphSnapshot graph,
        PrivilegePathEngineOptions options,
        SecureNowArchitectEngineRunScope? runScope = null) =>
        EnumerateWithLimits(graph, options, runScope).Candidates;

    internal static PrivilegePathEnumerationResult EnumerateWithLimits(
        InventoryPrivilegePathGraphSnapshot graph,
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

        List<PrivilegePathCandidate> results = [];
        HashSet<string> seenPathSignatures = new(StringComparer.Ordinal);

        IEnumerable<string> startNodes = graph.OutgoingEdges.Keys
            .Where(static nodeId => nodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal)
                || !nodeId.StartsWith("azure-ad://", StringComparison.Ordinal));

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

        return new PrivilegePathEnumerationResult
        {
            Candidates = results,
            LimitHits = limits.ToHits(options),
        };
    }

    private static void DepthFirstSearch(
        InventoryPrivilegePathGraphSnapshot graph,
        PrivilegePathEngineOptions options,
        string currentNode,
        List<PrivilegePathEdge> path,
        HashSet<string> visited,
        List<PrivilegePathCandidate> results,
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

            if (TryFinalizePath(graph, path, out PrivilegePathCandidate? candidate))
            {
                string signature = BuildPathSignature(candidate.Hops);

                if ((runScope is null || runScope.IsFullEstate
                    || SecureNowArchitectNeighborhoodFilter.CandidateTouchesSeeds(candidate, runScope.SeedCloudResourceIds, resourceIds))
                    && seenPathSignatures.Add(signature))
                {
                    results.Add(candidate);
                }
            }

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

        if (lastHop.EdgeType == GraphEdgeTypes.CanGrantRole
            && IsGlobalAdminElevationGrantRole(lastHop.InferenceSource))
        {
            return TryFinalizeGrantRoleElevationPath(graph, hops, lastHop, out candidate);
        }

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
                Hops = [..hops],
                TerminalScopeNodeId = scopeNodeId,
                EffectiveRoleName = roleName,
                HasInsufficientEvidenceHop = HasInsufficientEvidenceHop(hops),
                TerminalCloudResourceId = terminalResource?.CloudResourceId,
                TerminalResourceType = terminalResource?.ResourceType,
                ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                    scopeNodeId,
                    graph.ResourcesByArmId,
                    graph.TagsByResourceRowId),
                IsFederatedDeploymentPath = IsFederatedDeploymentPath(hops),
                IsGroupNestedPath = IsGroupNestedPath(hops),
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

        if (TryFinalizeExplicitActionPath(graph, hops, hasRoleHop, mappedRole, out candidate))
        {
            return true;
        }

        if (TryFinalizeControlToDataConversionPath(graph, hops, hasRoleHop, mappedRole, out candidate))
        {
            return true;
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
            Hops = [..hopsWithInsufficient],
            TerminalScopeNodeId = hasRoleHop.ToNodeId,
            EffectiveRoleName = mappedRole,
            HasInsufficientEvidenceHop = HasInsufficientEvidenceHop(hopsWithInsufficient),
            TerminalCloudResourceId = scopeResource?.CloudResourceId,
            TerminalResourceType = scopeResource?.ResourceType,
            ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                hasRoleHop.ToNodeId,
                graph.ResourcesByArmId,
                graph.TagsByResourceRowId),
            IsFederatedDeploymentPath = IsFederatedDeploymentPath(hopsWithInsufficient),
            IsGroupNestedPath = IsGroupNestedPath(hopsWithInsufficient),
        };

        return true;
    }

    private static bool TryFinalizeExplicitActionPath(
        InventoryPrivilegePathGraphSnapshot graph,
        IReadOnlyList<PrivilegePathEdge> hops,
        PrivilegePathEdge hasRoleHop,
        string? mappedRole,
        out PrivilegePathCandidate candidate)
    {
        candidate = null!;

        if (!TryGetExplicitActionEdge(graph, hasRoleHop, out PrivilegePathEdge? actionEdge))
        {
            return false;
        }

        List<PrivilegePathEdge> hopsWithAction = [.. hops, actionEdge];

        graph.ResourcesByArmId.TryGetValue(actionEdge.ToNodeId, out AzureInventoryResourceRecord? scopeResource);

        candidate = new PrivilegePathCandidate
        {
            Hops = [..hopsWithAction],
            TerminalScopeNodeId = actionEdge.ToNodeId,
            EffectiveRoleName = mappedRole,
            HasInsufficientEvidenceHop = HasInsufficientEvidenceHop(hopsWithAction),
            TerminalCloudResourceId = scopeResource?.CloudResourceId,
            TerminalResourceType = scopeResource?.ResourceType,
            ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                actionEdge.ToNodeId,
                graph.ResourcesByArmId,
                graph.TagsByResourceRowId),
            IsFederatedDeploymentPath = IsFederatedDeploymentPath(hopsWithAction),
            IsGroupNestedPath = IsGroupNestedPath(hopsWithAction),
        };

        return true;
    }

    private static bool TryGetExplicitActionEdge(
        InventoryPrivilegePathGraphSnapshot graph,
        PrivilegePathEdge hasRoleHop,
        out PrivilegePathEdge actionEdge)
    {
        if (graph.OutgoingEdges.TryGetValue(hasRoleHop.FromNodeId, out List<PrivilegePathEdge>? fromEdges))
        {
            PrivilegePathEdge? siblingAction = fromEdges.FirstOrDefault(edge =>
                edge.EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite
                && string.Equals(edge.ToNodeId, hasRoleHop.ToNodeId, StringComparison.OrdinalIgnoreCase));

            if (siblingAction is not null)
            {
                actionEdge = siblingAction;
                return true;
            }

            PrivilegePathEdge? descendantControlToData = fromEdges
                .Where(edge =>
                    edge.EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite
                    && IsControlToDataInferenceSource(edge.InferenceSource)
                    && ArmResourceIdNormalizer.IsDescendantOf(edge.ToNodeId, hasRoleHop.ToNodeId))
                .OrderByDescending(static edge =>
                    edge.EdgeType.Equals(GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
                .ThenBy(static edge => edge.ToNodeId, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault();

            if (descendantControlToData is not null)
            {
                actionEdge = descendantControlToData;
                return true;
            }

            PrivilegePathEdge? appSettingsCredentialRead = fromEdges
                .Where(edge =>
                    edge.EdgeType == GraphEdgeTypes.CanRead
                    && IsAppSettingsConnectionStringConversion(edge.InferenceSource))
                .OrderBy(static edge => edge.ToNodeId, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault();

            if (appSettingsCredentialRead is not null)
            {
                actionEdge = appSettingsCredentialRead;
                return true;
            }
        }

        if (graph.OutgoingEdges.TryGetValue(hasRoleHop.ToNodeId, out List<PrivilegePathEdge>? toEdges))
        {
            PrivilegePathEdge? chainedAction = toEdges.FirstOrDefault(static edge =>
                edge.EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite);

            if (chainedAction is not null)
            {
                actionEdge = chainedAction;
                return true;
            }
        }

        actionEdge = null!;
        return false;
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
            Hops = [..hopsWithAction],
            TerminalScopeNodeId = hasRoleHop.ToNodeId,
            EffectiveRoleName = mappedRole,
            HasInsufficientEvidenceHop = HasInsufficientEvidenceHop(hopsWithAction),
            TerminalCloudResourceId = scopeResource?.CloudResourceId,
            TerminalResourceType = scopeResource?.ResourceType,
            ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                hasRoleHop.ToNodeId,
                graph.ResourcesByArmId,
                graph.TagsByResourceRowId),
            IsFederatedDeploymentPath = IsFederatedDeploymentPath(hopsWithAction),
            IsGroupNestedPath = IsGroupNestedPath(hopsWithAction),
        };

        return true;
    }

    private static bool TryFinalizeControlToDataConversionPath(
        InventoryPrivilegePathGraphSnapshot graph,
        IReadOnlyList<PrivilegePathEdge> hops,
        PrivilegePathEdge hasRoleHop,
        string? mappedRole,
        out PrivilegePathCandidate candidate)
    {
        candidate = null!;

        if (!AzureInventoryControlPlaneBuiltinRoles.IsContributorOrOwner(mappedRole))
        {
            return false;
        }

        string scopeNodeId = hasRoleHop.ToNodeId;
        string? resourceType = null;
        IReadOnlyDictionary<string, string> properties = ReadResourceProperties(graph, scopeNodeId, ref resourceType);

        if (string.IsNullOrWhiteSpace(resourceType))
        {
            resourceType = InferResourceTypeFromArmId(scopeNodeId);
        }

        AzureInventoryControlToDataConversionResult conversion =
            AzureInventoryControlToDataConversionResolver.ResolveForResource(mappedRole, resourceType, properties);

        if (!conversion.HasPermission)
        {
            return false;
        }

        string actionEdgeType = conversion.Permission is AzureInventoryDerivedDataPlanePermission.Write
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
            InferenceSource = string.IsNullOrWhiteSpace(conversion.InferenceQualifier)
                ? GraphEdgeInferenceSources.InventoryControlToDataConversion
                : GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryControlToDataConversion,
                    conversion.InferenceQualifier!),
            RoleName = mappedRole,
        });

        graph.ResourcesByArmId.TryGetValue(scopeNodeId, out AzureInventoryResourceRecord? scopeResource);

        candidate = new PrivilegePathCandidate
        {
            Hops = [..hopsWithAction],
            TerminalScopeNodeId = scopeNodeId,
            EffectiveRoleName = mappedRole,
            HasInsufficientEvidenceHop = HasInsufficientEvidenceHop(hopsWithAction),
            TerminalCloudResourceId = scopeResource?.CloudResourceId,
            TerminalResourceType = scopeResource?.ResourceType ?? resourceType,
            ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                scopeNodeId,
                graph.ResourcesByArmId,
                graph.TagsByResourceRowId),
            IsFederatedDeploymentPath = IsFederatedDeploymentPath(hopsWithAction),
            IsGroupNestedPath = IsGroupNestedPath(hopsWithAction),
        };

        return true;
    }

    private static IReadOnlyDictionary<string, string> ReadResourceProperties(
        InventoryPrivilegePathGraphSnapshot graph,
        string scopeNodeId,
        ref string? resourceType)
    {
        if (!graph.ResourcesByArmId.TryGetValue(scopeNodeId, out AzureInventoryResourceRecord? resource))
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        resourceType = resource.ResourceType;

        if (!graph.PropertiesByResourceRowId.TryGetValue(resource.ResourceRowId, out IReadOnlyList<AzureInventoryResourcePropertyReadModel>? properties))
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (string.IsNullOrWhiteSpace(property.PropertyKey))
            {
                continue;
            }

            map[property.PropertyKey] = property.PropertyValue ?? string.Empty;
        }

        return map;
    }

    private static string? InferResourceTypeFromArmId(string armId)
    {
        if (armId.Contains("/Microsoft.Storage/storageAccounts/", StringComparison.OrdinalIgnoreCase))
        {
            return "Microsoft.Storage/storageAccounts";
        }

        if (armId.Contains("/Microsoft.KeyVault/vaults/", StringComparison.OrdinalIgnoreCase))
        {
            return "Microsoft.KeyVault/vaults";
        }

        return null;
    }

    private static string BuildPathSignature(IReadOnlyList<PrivilegePathEdge> hops) =>
        string.Join(
            ">",
            hops.Select(static hop => $"{hop.FromNodeId}|{hop.EdgeType}|{hop.ToNodeId}"
                + (hop.EdgeType == GraphEdgeTypes.HasRole && hop.RoleDefinitionId is not null
                    ? "|role:" + Uri.EscapeDataString(hop.RoleDefinitionId)
                    : string.Empty)));

    private static bool IsFederatedDeploymentPath(IReadOnlyList<PrivilegePathEdge> hops) =>
        hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.FederatesAs);

    private static bool IsGroupNestedPath(IReadOnlyList<PrivilegePathEdge> hops) =>
        hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.MemberOf);

    private static bool HasInsufficientEvidenceHop(IReadOnlyList<PrivilegePathEdge> hops) =>
        hops.Any(static hop => hop.EdgeType == "unknown-role-actions")
        || hops.Any(static hop => hop.InferenceSource == GraphEdgeInferenceSources.PimEligibilityUnknown)
        || hops.Any(static hop =>
            hop.EdgeType == GraphEdgeTypes.CanReach
            && string.Equals(
                hop.InferenceSource,
                SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType,
                StringComparison.OrdinalIgnoreCase));

    private static bool IsControlToDataInferenceSource(string? inferenceSource)
    {
        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        if (inferenceSource.Equals(
                GraphEdgeInferenceSources.InventoryControlToDataConversion,
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string prefix = GraphEdgeInferenceSources.InventoryControlToDataConversion
            + GraphEdgeInferenceSources.InferenceSourceQualifierSeparator;

        return inferenceSource.StartsWith(prefix, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAppSettingsConnectionStringConversion(string? inferenceSource)
    {
        if (!GraphEdgeInferenceSources.TrySplitQualifier(inferenceSource, out string baseSource, out string? qualifier))
        {
            return false;
        }

        return baseSource.Equals(GraphEdgeInferenceSources.InventoryControlToDataConversion, StringComparison.OrdinalIgnoreCase)
            && string.Equals(qualifier, "app-settings-connection-string", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsGlobalAdminElevationGrantRole(string? inferenceSource)
    {
        if (!GraphEdgeInferenceSources.TrySplitQualifier(inferenceSource, out string baseSource, out string? qualifier))
        {
            return false;
        }

        return baseSource.Equals(GraphEdgeInferenceSources.InventoryGrantRole, StringComparison.OrdinalIgnoreCase)
            && string.Equals(
                qualifier,
                AzureInventoryGrantRoleInferenceQualifiers.GlobalAdminElevation,
                StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryFinalizeGrantRoleElevationPath(
        InventoryPrivilegePathGraphSnapshot graph,
        IReadOnlyList<PrivilegePathEdge> hops,
        PrivilegePathEdge elevationHop,
        out PrivilegePathCandidate candidate)
    {
        candidate = null!;

        const string ownerRoleName = "Owner";
        string elevationScope = ArmResourceIdNormalizer.Normalize(elevationHop.ToNodeId);

        foreach (KeyValuePair<string, AzureInventoryResourceRecord> resourceEntry in graph.ResourcesByArmId
                     .OrderBy(static entry => entry.Key, StringComparer.OrdinalIgnoreCase))
        {
            if (!AzureInventoryControlToDataConversionResolver.RoleAssignmentScopeAppliesToResource(
                    elevationScope,
                    resourceEntry.Key))
            {
                continue;
            }

            string? resourceType = resourceEntry.Value.ResourceType;
            IReadOnlyDictionary<string, string> properties =
                ReadResourceProperties(graph, resourceEntry.Key, ref resourceType);

            if (string.IsNullOrWhiteSpace(resourceType))
            {
                resourceType = InferResourceTypeFromArmId(resourceEntry.Key);
            }

            AzureInventoryControlToDataConversionResult conversion =
                AzureInventoryControlToDataConversionResolver.ResolveForResource(
                    ownerRoleName,
                    resourceType,
                    properties);

            if (!conversion.HasPermission)
            {
                continue;
            }

            string normalizedResourceArmId = ArmResourceIdNormalizer.Normalize(resourceEntry.Key);
            string actionEdgeType = conversion.Permission is AzureInventoryDerivedDataPlanePermission.Write
                or AzureInventoryDerivedDataPlanePermission.ReadAndWrite
                ? GraphEdgeTypes.CanWrite
                : GraphEdgeTypes.CanRead;

            List<PrivilegePathEdge> hopsWithAction = [.. hops];
            hopsWithAction.Add(new PrivilegePathEdge
            {
                FromNodeId = elevationHop.FromNodeId,
                ToNodeId = normalizedResourceArmId,
                EdgeType = actionEdgeType,
                ProvenanceKind = ProvenanceKind.DerivedFact,
                InferenceSource = string.IsNullOrWhiteSpace(conversion.InferenceQualifier)
                    ? GraphEdgeInferenceSources.InventoryControlToDataConversion
                    : GraphEdgeInferenceSources.WithQualifier(
                        GraphEdgeInferenceSources.InventoryControlToDataConversion,
                        conversion.InferenceQualifier!),
                RoleName = ownerRoleName,
            });

            candidate = new PrivilegePathCandidate
            {
                Hops = [..hopsWithAction],
                TerminalScopeNodeId = normalizedResourceArmId,
                EffectiveRoleName = ownerRoleName,
                HasInsufficientEvidenceHop = HasInsufficientEvidenceHop(hopsWithAction),
                TerminalCloudResourceId = resourceEntry.Value.CloudResourceId,
                TerminalResourceType = resourceEntry.Value.ResourceType ?? resourceType,
                ScopeTaggedProduction = InventoryPrivilegePathGraph.IsScopeTaggedProduction(
                    resourceEntry.Key,
                    graph.ResourcesByArmId,
                    graph.TagsByResourceRowId),
                IsFederatedDeploymentPath = IsFederatedDeploymentPath(hopsWithAction),
                IsGroupNestedPath = IsGroupNestedPath(hopsWithAction),
            };

            return true;
        }

        return false;
    }
}
