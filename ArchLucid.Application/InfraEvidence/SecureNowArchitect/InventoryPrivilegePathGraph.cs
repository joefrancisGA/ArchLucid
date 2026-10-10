using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class InventoryPrivilegePathGraph
{
    private static readonly HashSet<string> TraversableEdgeTypes =
    [
        GraphEdgeTypes.HasRole,
        GraphEdgeTypes.UsesIdentity,
        GraphEdgeTypes.CanRead,
        GraphEdgeTypes.CanWrite,
        GraphEdgeTypes.CanAssume,
        GraphEdgeTypes.FederatesAs,
        GraphEdgeTypes.MemberOf,
    ];

    public static InventoryPrivilegePathGraphSnapshot Build(AzureInventorySnapshotDetailReadModel snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        Dictionary<string, List<PrivilegePathEdge>> outgoing = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, AzureInventoryResourceRecord> resourcesByArmId =
            snapshot.Resources.ToDictionary(static resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        Dictionary<Guid, List<AzureInventoryTagReadModel>> tagsByResourceRowId =
            snapshot.Tags
                .GroupBy(static tag => tag.ResourceRowId)
                .ToDictionary(static group => group.Key, static group => group.ToList());

        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByResourceRowId =
            snapshot.Properties
                .GroupBy(static property => property.ResourceRowId)
                .ToDictionary(static group => group.Key, static group => group.ToList());

        Dictionary<(string PrincipalId, string Scope), List<AzureInventoryRoleAssignmentReadModel>> assignmentsByPrincipalScope =
            snapshot.RoleAssignments
                .Where(assignment => !string.IsNullOrWhiteSpace(assignment.PrincipalId) && !string.IsNullOrWhiteSpace(assignment.Scope))
                .GroupBy(assignment => (assignment.PrincipalId.Trim(), ArmResourceIdNormalizer.Normalize(assignment.Scope)),
                    new PrincipalScopeComparer())
                .ToDictionary(group => group.Key, group => group
                    .DistinctBy(assignment => AzureInventoryRoleAssignmentIdentity.NormalizeRole(assignment.RoleDefinitionId))
                    .OrderBy(assignment => AzureInventoryRoleAssignmentIdentity.NormalizeRole(assignment.RoleDefinitionId), StringComparer.Ordinal)
                    .ToList(), new PrincipalScopeComparer());
        HashSet<(string PrincipalId, string Scope)> representedAssignments = new(new PrincipalScopeComparer());
        HashSet<string> roleEdgeKeys = new(StringComparer.Ordinal);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (!TraversableEdgeTypes.Contains(relationship.RelationshipType))
            {
                continue;
            }

            if (relationship.RelationshipType == GraphEdgeTypes.HasRole
                && relationship.FromAzureResourceId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal))
            {
                var key = (relationship.FromAzureResourceId[AzureInventoryPrincipalNodeId.Prefix.Length..].Trim(),
                    ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId));
                if (assignmentsByPrincipalScope.TryGetValue(key, out List<AzureInventoryRoleAssignmentReadModel>? assignments))
                {
                    representedAssignments.Add(key);
                    foreach (AzureInventoryRoleAssignmentReadModel assignment in assignments)
                    {
                        AddRoleEdge(outgoing, roleEdgeKeys, relationship.FromAzureResourceId, relationship.ToAzureResourceId,
                            assignment, relationship.ProvenanceKind, relationship.InferenceSource);
                    }
                    continue;
                }
            }

            AddEdge(outgoing, new PrivilegePathEdge
            {
                FromNodeId = relationship.FromAzureResourceId,
                ToNodeId = relationship.ToAzureResourceId,
                EdgeType = relationship.RelationshipType,
                ProvenanceKind = relationship.ProvenanceKind,
                InferenceSource = relationship.InferenceSource,
            });
        }

        // Assignment rows are direct evidence even when a materialized relationship row is absent.
        foreach (var (key, assignments) in assignmentsByPrincipalScope)
        {
            if (representedAssignments.Contains(key))
            {
                continue;
            }
            foreach (AzureInventoryRoleAssignmentReadModel assignment in assignments)
            {
                AddRoleEdge(outgoing, roleEdgeKeys, AzureInventoryPrincipalNodeId.Format(key.PrincipalId.ToLowerInvariant()),
                    key.Scope, assignment, ProvenanceKind.ObservedFact, GraphEdgeInferenceSources.InventoryRbacAssignment);
            }
        }

        Dictionary<string, string> managedIdentityPrincipalByArmId = BuildManagedIdentityPrincipalMap(
            resourcesByArmId,
            propertiesByResourceRowId);

        foreach (KeyValuePair<string, string> pair in managedIdentityPrincipalByArmId)
        {
            AddEdge(
                outgoing,
                new PrivilegePathEdge
                {
                    FromNodeId = pair.Key,
                    ToNodeId = AzureInventoryPrincipalNodeId.Format(pair.Value),
                    EdgeType = GraphEdgeTypes.CanAssume,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                    RoleName = null,
                });
        }

        return new InventoryPrivilegePathGraphSnapshot
        {
            OutgoingEdges = outgoing,
            ResourcesByArmId = resourcesByArmId,
            TagsByResourceRowId = tagsByResourceRowId,
            ManagedIdentityPrincipalByArmId = managedIdentityPrincipalByArmId,
        };
    }

    public static bool IsScopeTaggedProduction(
        string scopeArmId,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesByArmId,
        IReadOnlyDictionary<Guid, List<AzureInventoryTagReadModel>> tagsByResourceRowId)
    {
        if (!resourcesByArmId.TryGetValue(scopeArmId, out AzureInventoryResourceRecord? resource))
        {
            return false;
        }

        if (!tagsByResourceRowId.TryGetValue(resource.ResourceRowId, out List<AzureInventoryTagReadModel>? tags))
        {
            return false;
        }

        foreach (AzureInventoryTagReadModel tag in tags)
        {
            if (tag.TagKey.Equals("environment", StringComparison.OrdinalIgnoreCase)
                && tag.TagValue?.Equals("production", StringComparison.OrdinalIgnoreCase) == true)
            {
                return true;
            }

            if (tag.TagKey.Equals("production", StringComparison.OrdinalIgnoreCase)
                && tag.TagValue?.Equals("true", StringComparison.OrdinalIgnoreCase) == true)
            {
                return true;
            }
        }

        return false;
    }

    private static Dictionary<string, string> BuildManagedIdentityPrincipalMap(
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesByArmId,
        IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByResourceRowId)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in resourcesByArmId.Values)
        {
            if (!resource.ResourceType.Contains("ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!propertiesByResourceRowId.TryGetValue(resource.ResourceRowId, out List<AzureInventoryResourcePropertyReadModel>? properties))
            {
                continue;
            }

            string? principalId = properties
                .FirstOrDefault(property => property.PropertyKey.Equals("principalId", StringComparison.OrdinalIgnoreCase))
                ?.PropertyValue;

            if (string.IsNullOrWhiteSpace(principalId))
            {
                continue;
            }

            map[resource.AzureResourceId] = principalId.Trim();
        }

        return map;
    }

    private static void AddRoleEdge(
        Dictionary<string, List<PrivilegePathEdge>> outgoing,
        HashSet<string> roleEdgeKeys,
        string fromNodeId,
        string toNodeId,
        AzureInventoryRoleAssignmentReadModel assignment,
        ProvenanceKind provenanceKind,
        string? inferenceSource)
    {
        string roleDefinitionId = AzureInventoryRoleAssignmentIdentity.NormalizeRole(assignment.RoleDefinitionId);
        string identity = AzureInventoryRoleAssignmentIdentity.Create(assignment.PrincipalId, assignment.Scope, roleDefinitionId);
        if (!roleEdgeKeys.Add($"{identity}|{provenanceKind}|{inferenceSource}"))
        {
            return;
        }
        AddEdge(outgoing, new PrivilegePathEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.HasRole,
            ProvenanceKind = provenanceKind,
            InferenceSource = inferenceSource,
            RoleDefinitionId = roleDefinitionId,
            RoleName = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(assignment.RoleDefinitionId),
        });
    }

    private static void AddEdge(
        Dictionary<string, List<PrivilegePathEdge>> outgoing,
        PrivilegePathEdge edge)
    {
        if (!outgoing.TryGetValue(edge.FromNodeId, out List<PrivilegePathEdge>? edges))
        {
            edges = [];
            outgoing[edge.FromNodeId] = edges;
        }

        edges.Add(edge);
    }

    private sealed class PrincipalScopeComparer : IEqualityComparer<(string PrincipalId, string Scope)>
    {
        public bool Equals((string PrincipalId, string Scope) x, (string PrincipalId, string Scope) y) =>
            string.Equals(x.PrincipalId, y.PrincipalId, StringComparison.OrdinalIgnoreCase)
            && string.Equals(x.Scope, y.Scope, StringComparison.OrdinalIgnoreCase);

        public int GetHashCode((string PrincipalId, string Scope) obj) =>
            HashCode.Combine(
                StringComparer.OrdinalIgnoreCase.GetHashCode(obj.PrincipalId),
                StringComparer.OrdinalIgnoreCase.GetHashCode(obj.Scope));
    }
}

internal sealed class InventoryPrivilegePathGraphSnapshot
{
    public IReadOnlyDictionary<string, List<PrivilegePathEdge>> OutgoingEdges
    {
        get;
        init;
    } = new Dictionary<string, List<PrivilegePathEdge>>();

    public IReadOnlyDictionary<string, AzureInventoryResourceRecord> ResourcesByArmId
    {
        get;
        init;
    } = new Dictionary<string, AzureInventoryResourceRecord>();

    public IReadOnlyDictionary<Guid, List<AzureInventoryTagReadModel>> TagsByResourceRowId
    {
        get;
        init;
    } = new Dictionary<Guid, List<AzureInventoryTagReadModel>>();

    public IReadOnlyDictionary<string, string> ManagedIdentityPrincipalByArmId
    {
        get;
        init;
    } = new Dictionary<string, string>();
}
