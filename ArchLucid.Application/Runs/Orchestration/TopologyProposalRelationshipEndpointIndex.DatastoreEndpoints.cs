using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

public static partial class TopologyProposalRelationshipEndpointIndex
{
    public static void AddManifestDatastoreEndpointKeys(HashSet<string> endpointKeys, ManifestDatastore datastore)
    {
        AddEndpointKey(endpointKeys, datastore.DatastoreName);
        AddEndpointKey(endpointKeys, datastore.DatastoreId);
        AddSyntheticDatastoreEndpointKey(endpointKeys, datastore.DatastoreName);
    }

    public static void AddManifestDatastoreEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestDatastore datastore,
        IReadOnlyList<GraphNode> graphNodes)
    {
        if (!TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, datastore.DatastoreName, nodeId);
        AddResolutionAlias(aliasToNodeId, datastore.DatastoreId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(datastore.DatastoreName), nodeId);
    }

    public static void AddDeclaredManifestDatastoreEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestDatastore datastore)
    {
        string nodeId = ResolveDeclaredDatastoreNodeId(datastore);

        if (string.IsNullOrWhiteSpace(nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, datastore.DatastoreName, nodeId);
        AddResolutionAlias(aliasToNodeId, datastore.DatastoreId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(datastore.DatastoreName), nodeId);
        TopologyProposalEndpointArmKeys.AddArmResourceIdResolutionAliases(
            aliasToNodeId,
            TrimManifestEndpointValue(datastore.DatastoreId),
            nodeId);
    }

    public static bool TryClaimDatastore(ManifestDatastore datastore, HashSet<string> claimedEndpointKeys) =>
        TryClaimEndpoint(datastore, claimedEndpointKeys, static d => d.DatastoreName, static d => d.DatastoreId, BuildSyntheticDatastoreNodeId);

    public static bool IsRenameAliasDatastore(ManifestDatastore candidate, IReadOnlyList<ManifestDatastore> acceptedDatastores)
    {
        string? candidateId = TrimManifestEndpointValue(candidate.DatastoreId);
        string? candidateName = TrimManifestEndpointValue(candidate.DatastoreName);

        if (candidateId is null || candidateName is null)
            return false;

        foreach (ManifestDatastore accepted in acceptedDatastores)
        {
            string? acceptedId = TrimManifestEndpointValue(accepted.DatastoreId);

            if (!string.Equals(acceptedId, candidateId, StringComparison.OrdinalIgnoreCase))
                continue;

            string? acceptedName = TrimManifestEndpointValue(accepted.DatastoreName);

            return !string.Equals(acceptedName, candidateName, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public static bool TryResolveGraphTopologyNodeIdForDatastore(
        ManifestDatastore datastore,
        IReadOnlyList<GraphNode> graphNodes,
        out string nodeId) =>
        TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out nodeId);

    private static string ResolveDeclaredDatastoreNodeId(ManifestDatastore datastore)
    {
        string? datastoreId = TrimManifestEndpointValue(datastore.DatastoreId);

        if (!string.IsNullOrWhiteSpace(datastoreId))
            return datastoreId;

        string? syntheticNodeId = BuildSyntheticDatastoreNodeId(TrimManifestEndpointValue(datastore.DatastoreName));

        return syntheticNodeId ?? string.Empty;
    }
}
