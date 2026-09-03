using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

public static partial class TopologyProposalRelationshipEndpointIndex
{
    public static void AddManifestServiceEndpointKeys(HashSet<string> endpointKeys, ManifestService service)
    {
        AddEndpointKey(endpointKeys, service.ServiceName);
        AddEndpointKey(endpointKeys, service.ServiceId);
        AddSyntheticServiceEndpointKey(endpointKeys, service.ServiceName);
    }

    public static void AddManifestServiceEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestService service,
        IReadOnlyList<GraphNode> graphNodes)
    {
        if (!TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, service.ServiceName, nodeId);
        AddResolutionAlias(aliasToNodeId, service.ServiceId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(service.ServiceName), nodeId);
    }

    public static void AddDeclaredManifestServiceEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestService service)
    {
        string nodeId = ResolveDeclaredServiceNodeId(service);

        if (string.IsNullOrWhiteSpace(nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, service.ServiceName, nodeId);
        AddResolutionAlias(aliasToNodeId, service.ServiceId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(service.ServiceName), nodeId);
        TopologyProposalEndpointArmKeys.AddArmResourceIdResolutionAliases(
            aliasToNodeId,
            TrimManifestEndpointValue(service.ServiceId),
            nodeId);
    }

    public static bool TryClaimService(ManifestService service, HashSet<string> claimedEndpointKeys) =>
        TryClaimEndpoint(service, claimedEndpointKeys, static s => s.ServiceName, static s => s.ServiceId, BuildSyntheticServiceNodeId);

    public static bool IsRenameAliasService(ManifestService candidate, IReadOnlyList<ManifestService> acceptedServices)
    {
        string? candidateId = TrimManifestEndpointValue(candidate.ServiceId);
        string? candidateName = TrimManifestEndpointValue(candidate.ServiceName);

        if (candidateId is null || candidateName is null)
            return false;

        foreach (ManifestService accepted in acceptedServices)
        {
            string? acceptedId = TrimManifestEndpointValue(accepted.ServiceId);

            if (!string.Equals(acceptedId, candidateId, StringComparison.OrdinalIgnoreCase))
                continue;

            string? acceptedName = TrimManifestEndpointValue(accepted.ServiceName);

            return !string.Equals(acceptedName, candidateName, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public static bool TryResolveGraphTopologyNodeIdForService(
        ManifestService service,
        IReadOnlyList<GraphNode> graphNodes,
        out string nodeId) =>
        TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out nodeId);

    private static string ResolveDeclaredServiceNodeId(ManifestService service)
    {
        string? serviceId = TrimManifestEndpointValue(service.ServiceId);

        if (!string.IsNullOrWhiteSpace(serviceId))
            return serviceId;

        string? syntheticNodeId = BuildSyntheticServiceNodeId(TrimManifestEndpointValue(service.ServiceName));

        return syntheticNodeId ?? string.Empty;
    }
}
