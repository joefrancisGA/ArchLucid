using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Indexes topology proposal service/datastore names and ids for relationship endpoint validation.
/// </summary>
public static partial class TopologyProposalRelationshipEndpointIndex
{
    public static HashSet<string> CollectKnownEndpointKeys(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores)
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestService service in services)
        {
            AddManifestServiceEndpointKeys(knownEndpointKeys, service);
        }

        foreach (ManifestDatastore datastore in datastores)
        {
            AddManifestDatastoreEndpointKeys(knownEndpointKeys, datastore);
        }

        return knownEndpointKeys;
    }

    public static void AddGraphNodeEndpointKeys(HashSet<string> endpointKeys, GraphNode node)
    {
        AddEndpointKey(endpointKeys, node.Label);
        AddEndpointKey(endpointKeys, node.NodeId);

        // "ProposedChanges" is a provenance sentinel shared by every topology-agent node, not an architecture endpoint.
        if (!TopologyProposalGraphNodeMatchers.IsAgentProposedSourceSentinel(node.SourceId))
            AddEndpointKey(endpointKeys, node.SourceId);

        TopologyProposalEndpointArmKeys.AddArmResourceIdEndpointKeys(
            endpointKeys,
            GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node));
        TopologyProposalTerraformSourceIdHeuristics.AddGraphNodeSyntheticLabelEndpointKeys(
            endpointKeys,
            node.Label,
            node.Category,
            node.SourceId);
    }

    public static void AddGraphNodeResolutionKeys(Dictionary<string, string> endpointKeyToNodeId, GraphNode node)
    {
        AddResolutionAlias(endpointKeyToNodeId, node.NodeId, node.NodeId);
        AddResolutionAlias(endpointKeyToNodeId, node.Label, node.NodeId);

        if (!TopologyProposalGraphNodeMatchers.IsAgentProposedSourceSentinel(node.SourceId))
            AddResolutionAlias(endpointKeyToNodeId, node.SourceId, node.NodeId);

        TopologyProposalEndpointArmKeys.AddArmResourceIdResolutionAliases(
            endpointKeyToNodeId,
            GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            node.NodeId);
        TopologyProposalTerraformSourceIdHeuristics.AddGraphNodeSyntheticLabelResolutionAliases(
            endpointKeyToNodeId,
            node.Label,
            node.Category,
            node.SourceId,
            node.NodeId);
    }

    public static bool TryClaim(object endpoint, HashSet<string> claimedEndpointKeys, ITopologyEndpointSource source) =>
        source.TryClaim(endpoint, claimedEndpointKeys);

    internal static string? TrimManifestEndpointValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    internal static void AddEndpointKey(HashSet<string> knownEndpointKeys, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        knownEndpointKeys.Add(value.Trim());
    }

    internal static void AddResolutionAlias(Dictionary<string, string> aliasToNodeId, string? endpointKey, string nodeId)
    {
        if (string.IsNullOrWhiteSpace(endpointKey))
            return;

        aliasToNodeId.TryAdd(endpointKey.Trim(), nodeId);
    }

    internal static void AddSyntheticServiceEndpointKey(HashSet<string> endpointKeys, string? serviceName)
    {
        AddEndpointKey(endpointKeys, BuildSyntheticServiceNodeId(serviceName));
    }

    internal static void AddSyntheticDatastoreEndpointKey(HashSet<string> endpointKeys, string? datastoreName)
    {
        AddEndpointKey(endpointKeys, BuildSyntheticDatastoreNodeId(datastoreName));
    }

    internal static string? BuildSyntheticServiceNodeId(string? serviceName) =>
        string.IsNullOrWhiteSpace(serviceName) ? null : $"svc-{serviceName}";

    internal static string? BuildSyntheticDatastoreNodeId(string? datastoreName) =>
        string.IsNullOrWhiteSpace(datastoreName) ? null : $"ds-{datastoreName}";
}
