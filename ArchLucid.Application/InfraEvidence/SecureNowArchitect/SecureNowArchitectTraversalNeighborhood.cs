using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Reverse reachability retains incoming dependencies before a changed node is visited.</summary>
internal sealed class SecureNowArchitectTraversalNeighborhood
{
    private readonly HashSet<string> _ancestors = new(StringComparer.OrdinalIgnoreCase);
    private readonly HashSet<string> _seedNodes = new(StringComparer.OrdinalIgnoreCase);

    public SecureNowArchitectTraversalNeighborhood(
        IReadOnlyDictionary<string, List<PrivilegePathEdge>> outgoing,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resources,
        IReadOnlySet<Guid> seedIds,
        int maxDepth)
    {
        string[] seedArmIds = resources.Values
            .Where(resource => resource.CloudResourceId is Guid id && seedIds.Contains(id))
            .Select(resource => resource.AzureResourceId).ToArray();
        HashSet<string> exactSeeds = new(seedArmIds, StringComparer.OrdinalIgnoreCase);
        SecureNowArchitectLegacySeedSuffixIndex legacySeedSuffixIndex = new(seedArmIds);
        HashSet<string> inheritedScopes = new(StringComparer.OrdinalIgnoreCase);
        foreach (string armId in seedArmIds)
        {
            string scope = ArmResourceIdNormalizer.Normalize(armId);
            while (scope.LastIndexOf('/') is int separator && separator > 0)
            {
                inheritedScopes.Add(scope);
                scope = scope[..separator];
            }
        }
        Dictionary<string, List<string>> incoming = new(StringComparer.OrdinalIgnoreCase);
        foreach ((string from, List<PrivilegePathEdge> edges) in outgoing)
            foreach (PrivilegePathEdge edge in edges)
            {
                if (!incoming.TryGetValue(edge.ToNodeId, out List<string>? parents))
                    incoming[edge.ToNodeId] = parents = [];
                parents.Add(from);
            }

        IEnumerable<string> nodes = outgoing.Keys.Concat(incoming.Keys).Distinct(StringComparer.OrdinalIgnoreCase);
        Queue<(string Node, int Depth)> queue = new();
        foreach (string node in nodes)
        {
            bool touchesSeed = exactSeeds.Contains(node);
            // Standard ARM and principal ids need no suffix scan; retain compatibility for prefixed legacy ids.
            if (!touchesSeed && !resources.ContainsKey(node)
                && !node.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
                && !node.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.OrdinalIgnoreCase)
                && !node.StartsWith("azure-ad://", StringComparison.OrdinalIgnoreCase))
                touchesSeed = legacySeedSuffixIndex.MatchesLegacyPrefixedNode(node);
            if (touchesSeed)
                _seedNodes.Add(node);

            // Role elevation can synthesize a data-plane hop from an inherited ARM scope.
            bool inheritedScope = node.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
                && inheritedScopes.Contains(ArmResourceIdNormalizer.Normalize(node));
            if ((touchesSeed || inheritedScope) && _ancestors.Add(node))
                queue.Enqueue((node, 0));
        }

        while (queue.TryDequeue(out var entry))
        {
            if (entry.Depth >= maxDepth || !incoming.TryGetValue(entry.Node, out List<string>? parents))
                continue;
            foreach (string parent in parents)
                if (_ancestors.Add(parent))
                    queue.Enqueue((parent, entry.Depth + 1));
        }
    }

    public bool CanReachSeed(string node) => _ancestors.Contains(node);
    public bool TouchesSeed(string node) => _seedNodes.Contains(node);
}
