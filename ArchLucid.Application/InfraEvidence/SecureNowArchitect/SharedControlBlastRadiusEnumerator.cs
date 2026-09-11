using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SharedControlBlastRadiusScopeClassifier
{
    public static bool IsBroadAssignmentScope(string scopeArmId)
    {
        if (string.IsNullOrWhiteSpace(scopeArmId))
        {
            return false;
        }

        if (scopeArmId.Contains("/resourceGroups/", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return scopeArmId.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase)
               || scopeArmId.Contains("managementGroups", StringComparison.OrdinalIgnoreCase);
    }

    public static int CountSnapshotResourcesUnderScope(
        IReadOnlyList<AzureInventoryResourceRecord> resources,
        string scopeArmId)
    {
        string normalizedScope = ArmResourceIdNormalizer.Normalize(scopeArmId);

        if (normalizedScope.Contains("managementGroups", StringComparison.OrdinalIgnoreCase))
        {
            return resources.Count;
        }

        return resources.Count(resource =>
            resource.AzureResourceId.StartsWith(normalizedScope, StringComparison.OrdinalIgnoreCase));
    }
}

internal static class SharedControlBlastRadiusEnumerator
{
    public static IReadOnlyList<SharedControlBlastRadiusCandidate> Enumerate(
        AzureInventorySnapshotDetailReadModel snapshot,
        SharedControlBlastRadiusEngineOptions options)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(options);

        Dictionary<string, AzureInventoryResourceRecord> resourcesByArmId =
            snapshot.Resources.ToDictionary(static resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        List<SharedControlBlastRadiusCandidate> results = [];
        HashSet<string> seenSignatures = new(StringComparer.Ordinal);

        AppendSharedManagedIdentityCandidates(snapshot, resourcesByArmId, options, results, seenSignatures);
        AppendBroadScopeRoleAssignmentCandidates(snapshot, resourcesByArmId, options, results, seenSignatures);
        AppendBroadScopePolicyAssignmentCandidates(snapshot, resourcesByArmId, options, results, seenSignatures);
        AppendCentralKeyVaultCandidates(snapshot, resourcesByArmId, options, results, seenSignatures);

        return results;
    }

    private static void AppendSharedManagedIdentityCandidates(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesByArmId,
        SharedControlBlastRadiusEngineOptions options,
        List<SharedControlBlastRadiusCandidate> results,
        HashSet<string> seenSignatures)
    {
        IEnumerable<IGrouping<string, AzureInventoryResourceRelationshipReadModel>> groups = snapshot.Relationships
            .Where(static relationship =>
                relationship.RelationshipType.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
            .GroupBy(static relationship => relationship.ToAzureResourceId, StringComparer.OrdinalIgnoreCase);

        foreach (IGrouping<string, AzureInventoryResourceRelationshipReadModel> group in groups)
        {
            List<string> dependents = group
                .Select(static relationship => relationship.FromAzureResourceId)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (dependents.Count < options.MinSharedDependents)
            {
                continue;
            }

            TryAddCandidate(
                results,
                seenSignatures,
                new SharedControlBlastRadiusCandidate
                {
                    ControlKind = SharedControlBlastRadiusControlKind.SharedManagedIdentity,
                    ControlNodeId = group.Key,
                    DependentNodeIds = dependents,
                    DependentCount = dependents.Count,
                    ControlCloudResourceId = resourcesByArmId.TryGetValue(group.Key, out AzureInventoryResourceRecord? controlResource)
                        ? controlResource.CloudResourceId
                        : null,
                    ControlResourceType = controlResource?.ResourceType,
                    Hops = BuildFanOutHops(group.Key, dependents, GraphEdgeTypes.UsesIdentity),
                });
        }
    }

    private static void AppendBroadScopeRoleAssignmentCandidates(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesByArmId,
        SharedControlBlastRadiusEngineOptions options,
        List<SharedControlBlastRadiusCandidate> results,
        HashSet<string> seenSignatures)
    {
        IEnumerable<IGrouping<string, AzureInventoryRoleAssignmentReadModel>> groups = snapshot.RoleAssignments
            .Where(static assignment => SharedControlBlastRadiusScopeClassifier.IsBroadAssignmentScope(assignment.Scope))
            .GroupBy(static assignment => ArmResourceIdNormalizer.Normalize(assignment.Scope), StringComparer.OrdinalIgnoreCase);

        foreach (IGrouping<string, AzureInventoryRoleAssignmentReadModel> group in groups)
        {
            List<string> dependents = snapshot.Resources
                .Select(static resource => resource.AzureResourceId)
                .Where(resourceArmId =>
                    group.Key.Contains("managementGroups", StringComparison.OrdinalIgnoreCase)
                    || resourceArmId.StartsWith(group.Key, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (dependents.Count < options.MinSharedDependents)
            {
                continue;
            }

            TryAddCandidate(
                results,
                seenSignatures,
                new SharedControlBlastRadiusCandidate
                {
                    ControlKind = SharedControlBlastRadiusControlKind.BroadScopeRoleAssignment,
                    ControlNodeId = group.Key,
                    DependentNodeIds = dependents,
                    DependentCount = dependents.Count,
                    ControlCloudResourceId = resourcesByArmId.TryGetValue(group.Key, out AzureInventoryResourceRecord? controlResource)
                        ? controlResource.CloudResourceId
                        : null,
                    ControlResourceType = controlResource?.ResourceType,
                    Hops = BuildFanOutHops(group.Key, dependents, GraphEdgeTypes.HasRole),
                });
        }
    }

    private static void AppendBroadScopePolicyAssignmentCandidates(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesByArmId,
        SharedControlBlastRadiusEngineOptions options,
        List<SharedControlBlastRadiusCandidate> results,
        HashSet<string> seenSignatures)
    {
        IEnumerable<AzureInventoryResourceRelationshipReadModel> policyAssignments = snapshot.Relationships
            .Where(static relationship =>
                relationship.RelationshipType.Equals(GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase)
                && SharedControlBlastRadiusScopeClassifier.IsBroadAssignmentScope(relationship.ToAzureResourceId));

        foreach (AzureInventoryResourceRelationshipReadModel assignment in policyAssignments)
        {
            List<string> dependents = snapshot.Resources
                .Select(static resource => resource.AzureResourceId)
                .Where(resourceArmId =>
                    assignment.ToAzureResourceId.Contains("managementGroups", StringComparison.OrdinalIgnoreCase)
                    || resourceArmId.StartsWith(
                        ArmResourceIdNormalizer.Normalize(assignment.ToAzureResourceId),
                        StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (dependents.Count < options.MinSharedDependents)
            {
                continue;
            }

            List<PrivilegePathEdge> hops =
            [
                new PrivilegePathEdge
                {
                    FromNodeId = assignment.FromAzureResourceId,
                    ToNodeId = assignment.ToAzureResourceId,
                    EdgeType = GraphEdgeTypes.AppliesTo,
                    ProvenanceKind = assignment.ProvenanceKind,
                    RoleName = null,
                },
                .. BuildFanOutHops(assignment.ToAzureResourceId, dependents, GraphEdgeTypes.AppliesTo),
            ];

            TryAddCandidate(
                results,
                seenSignatures,
                new SharedControlBlastRadiusCandidate
                {
                    ControlKind = SharedControlBlastRadiusControlKind.BroadScopePolicyAssignment,
                    ControlNodeId = assignment.ToAzureResourceId,
                    DependentNodeIds = dependents,
                    DependentCount = dependents.Count,
                    ControlCloudResourceId = resourcesByArmId.TryGetValue(assignment.ToAzureResourceId, out AzureInventoryResourceRecord? scopeResource)
                        ? scopeResource.CloudResourceId
                        : null,
                    ControlResourceType = scopeResource?.ResourceType,
                    Hops = hops,
                });
        }
    }

    private static void AppendCentralKeyVaultCandidates(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesByArmId,
        SharedControlBlastRadiusEngineOptions options,
        List<SharedControlBlastRadiusCandidate> results,
        HashSet<string> seenSignatures)
    {
        IEnumerable<IGrouping<string, AzureInventoryResourceRelationshipReadModel>> groups = snapshot.Relationships
            .Where(static relationship =>
                relationship.RelationshipType.Equals(GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase)
                && relationship.ToAzureResourceId.Contains("vaults", StringComparison.OrdinalIgnoreCase))
            .GroupBy(static relationship => relationship.ToAzureResourceId, StringComparer.OrdinalIgnoreCase);

        foreach (IGrouping<string, AzureInventoryResourceRelationshipReadModel> group in groups)
        {
            List<string> dependents = group
                .Select(static relationship => relationship.FromAzureResourceId)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (dependents.Count < options.MinSharedDependents)
            {
                continue;
            }

            TryAddCandidate(
                results,
                seenSignatures,
                new SharedControlBlastRadiusCandidate
                {
                    ControlKind = SharedControlBlastRadiusControlKind.CentralKeyVault,
                    ControlNodeId = group.Key,
                    DependentNodeIds = dependents,
                    DependentCount = dependents.Count,
                    ControlCloudResourceId = resourcesByArmId.TryGetValue(group.Key, out AzureInventoryResourceRecord? controlResource)
                        ? controlResource.CloudResourceId
                        : null,
                    ControlResourceType = controlResource?.ResourceType,
                    Hops = BuildFanOutHops(group.Key, dependents, GraphEdgeTypes.HasRole),
                });
        }
    }

    private static IReadOnlyList<PrivilegePathEdge> BuildFanOutHops(
        string controlNodeId,
        IReadOnlyList<string> dependentNodeIds,
        string citedEdgeType)
    {
        List<PrivilegePathEdge> hops = [];

        foreach (string dependentNodeId in dependentNodeIds)
        {
            hops.Add(new PrivilegePathEdge
            {
                FromNodeId = controlNodeId,
                ToNodeId = dependentNodeId,
                EdgeType = SecureNowArchitectConstants.SharedControlFanOutHopEdgeType,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                RoleName = citedEdgeType,
            });
        }

        return hops;
    }

    private static void TryAddCandidate(
        List<SharedControlBlastRadiusCandidate> results,
        HashSet<string> seenSignatures,
        SharedControlBlastRadiusCandidate candidate)
    {
        string signature = BuildSignature(candidate);

        if (!seenSignatures.Add(signature))
        {
            return;
        }

        results.Add(candidate);
    }

    private static string BuildSignature(SharedControlBlastRadiusCandidate candidate) =>
        $"{candidate.ControlKind}|{candidate.ControlNodeId}|{candidate.DependentCount}|{string.Join(',', candidate.DependentNodeIds)}";
}
