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

        Dictionary<(string PrincipalId, string Scope), string?> roleNameByAssignment =
            snapshot.RoleAssignments.ToDictionary(
                static assignment => (assignment.PrincipalId, ArmResourceIdNormalizer.Normalize(assignment.Scope)),
                static assignment => AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(
                    assignment.RoleDefinitionId),
                new PrincipalScopeComparer());

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (!TraversableEdgeTypes.Contains(relationship.RelationshipType))
            {
                continue;
            }

            string? roleName = null;

            if (relationship.RelationshipType == GraphEdgeTypes.HasRole
                && relationship.FromAzureResourceId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal))
            {
                string principalId = relationship.FromAzureResourceId[AzureInventoryPrincipalNodeId.Prefix.Length..];
                roleNameByAssignment.TryGetValue(
                    (principalId, relationship.ToAzureResourceId),
                    out roleName);
            }

            AddEdge(
                outgoing,
                new PrivilegePathEdge
                {
                    FromNodeId = relationship.FromAzureResourceId,
                    ToNodeId = relationship.ToAzureResourceId,
                    EdgeType = relationship.RelationshipType,
                    ProvenanceKind = relationship.ProvenanceKind,
                    RoleName = roleName,
                    InferenceSource = relationship.InferenceSource,
                });
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
            RoleNameByAssignment = roleNameByAssignment,
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

    public IReadOnlyDictionary<(string PrincipalId, string Scope), string?> RoleNameByAssignment
    {
        get;
        init;
    } = new Dictionary<(string PrincipalId, string Scope), string?>();

    public IReadOnlyDictionary<string, string> ManagedIdentityPrincipalByArmId
    {
        get;
        init;
    } = new Dictionary<string, string>();
}
