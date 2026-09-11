using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecureNowArchitectNeighborhoodExpander
{
    private static readonly HashSet<AzureInventoryChangeType> SeedChangeTypes =
    [
        AzureInventoryChangeType.PermissionChanged,
        AzureInventoryChangeType.NetworkExposureChanged,
        AzureInventoryChangeType.IdentityChanged,
        AzureInventoryChangeType.RelationshipAdded,
        AzureInventoryChangeType.RelationshipRemoved,
        AzureInventoryChangeType.SecurityControlChanged,
    ];

    public static IReadOnlySet<Guid> Expand(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<AzureInventoryChangeRecord> changes)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(changes);

        Dictionary<string, Guid> cloudResourceIdByArmId = snapshot.Resources
            .Where(resource => resource.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
            .ToDictionary(resource => resource.AzureResourceId, resource => resource.CloudResourceId!.Value, StringComparer.OrdinalIgnoreCase);

        HashSet<Guid> seeds = [];

        foreach (AzureInventoryChangeRecord change in changes)
        {

            if (!SeedChangeTypes.Contains(change.ChangeType))
            {
                continue;
            }

            if (change.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
            {
                seeds.Add(cloudResourceId);
            }

            if (!string.IsNullOrWhiteSpace(change.AzureResourceId)
                && cloudResourceIdByArmId.TryGetValue(change.AzureResourceId, out Guid mappedId))
            {
                seeds.Add(mappedId);
            }
        }

        if (seeds.Count == 0)
        {
            return seeds;
        }

        HashSet<Guid> expanded = new(seeds);
        Dictionary<Guid, HashSet<Guid>> adjacency = BuildAdjacency(snapshot, cloudResourceIdByArmId);

        foreach (Guid seed in seeds)
        {

            if (!adjacency.TryGetValue(seed, out HashSet<Guid>? neighbors))
            {
                continue;
            }

            foreach (Guid neighbor in neighbors)
            {
                expanded.Add(neighbor);
            }
        }

        return expanded;
    }

    private static Dictionary<Guid, HashSet<Guid>> BuildAdjacency(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId)
    {
        Dictionary<Guid, HashSet<Guid>> adjacency = new();

        void AddEdge(Guid left, Guid right)
        {
            if (left == Guid.Empty || right == Guid.Empty || left == right)
            {
                return;
            }

            if (!adjacency.TryGetValue(left, out HashSet<Guid>? leftNeighbors))
            {
                leftNeighbors = [];
                adjacency[left] = leftNeighbors;
            }

            leftNeighbors.Add(right);

            if (!adjacency.TryGetValue(right, out HashSet<Guid>? rightNeighbors))
            {
                rightNeighbors = [];
                adjacency[right] = rightNeighbors;
            }

            rightNeighbors.Add(left);
        }

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {

            if (!cloudResourceIdByArmId.TryGetValue(relationship.FromAzureResourceId, out Guid fromId))
            {
                continue;
            }

            if (!cloudResourceIdByArmId.TryGetValue(relationship.ToAzureResourceId, out Guid toId))
            {
                continue;
            }

            AddEdge(fromId, toId);
        }

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {

            if (resource.CloudResourceId is not Guid cloudResourceId || cloudResourceId == Guid.Empty)
            {
                continue;
            }

            if (IsNetworkSecurityGroup(resource.ResourceType))
            {
                adjacency.TryAdd(cloudResourceId, []);
            }
        }

        return adjacency;
    }

    private static bool IsNetworkSecurityGroup(string resourceType) =>
        resourceType.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase);
}
