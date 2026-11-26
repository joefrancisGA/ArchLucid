using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class InventoryPrivilegePathCanReachAppender
{
    private static readonly HashSet<string> UsageIntentInferenceSources = new(StringComparer.OrdinalIgnoreCase)
    {
        GraphEdgeInferenceSources.InventoryHostnameInferredTarget,
        GraphEdgeInferenceSources.InventoryAppKeyVaultRef,
        GraphEdgeInferenceSources.InventoryStorageHostRef,
        GraphEdgeInferenceSources.InventoryServiceConnectorLink,
        GraphEdgeInferenceSources.InventoryObservedDependency,
        GraphEdgeInferenceSources.InventoryAdfLinkedService,
        GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred,
        GraphEdgeInferenceSources.InventoryAdfReadsFrom,
        GraphEdgeInferenceSources.InventoryAdfWritesTo,
        GraphEdgeInferenceSources.InventorySynapseLinkedService,
        GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred,
        GraphEdgeInferenceSources.InventorySynapseReadsFrom,
        GraphEdgeInferenceSources.InventorySynapseWritesTo,
    };

    public static void Append(
        AzureInventorySnapshotDetailReadModel snapshot,
        Dictionary<string, List<PrivilegePathEdge>> outgoing)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(outgoing);

        AzureInventoryPrivateEndpointDnsJoinIndex dnsJoinIndex =
            AzureInventoryPrivateEndpointDnsJoinIndex.Build(
                snapshot.Relationships.Select(static relationship =>
                    new AzureInventoryRelationshipArmTriple(
                        relationship.FromAzureResourceId,
                        relationship.ToAzureResourceId,
                        relationship.InferenceSource)));

        var propertiesByRow = snapshot.Properties.ToLookup(property => property.ResourceRowId);
        var endpointResources = snapshot.Resources
            .Where(resource => string.Equals(resource.ResourceType, "Microsoft.Network/privateEndpoints", StringComparison.OrdinalIgnoreCase))
            .GroupBy(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() == 1)
            .ToDictionary(group => group.Key, group => new AzureInventoryReachabilityResourceProperties
            {
                ResourceType = group.Single().ResourceType,
                Properties = propertiesByRow[group.Single().ResourceRowId]
                    .Where(property => !string.IsNullOrWhiteSpace(property.PropertyKey))
                    .GroupBy(property => property.PropertyKey, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(properties => properties.Key,
                        properties => properties.Select(property => property.PropertyValue ?? string.Empty)
                            .Distinct(StringComparer.Ordinal).Count() == 1
                            ? properties.First().PropertyValue ?? string.Empty : string.Empty,
                        StringComparer.OrdinalIgnoreCase),
            }, StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (!string.Equals(
                    relationship.InferenceSource,
                    GraphEdgeInferenceSources.InventoryPeReachableTarget,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!dnsJoinIndex.HasPeReachableTarget(relationship.FromAzureResourceId, relationship.ToAzureResourceId))
                continue;

            if (InventoryPrivateFlowVerdict.Evaluate(dnsJoinIndex, relationship.FromAzureResourceId,
                    relationship.ToAzureResourceId, endpointResources) == AzurePrivateConnectivityState.Blocked)
                continue;

            InventoryPrivilegePathGraph.AddEdge(
                outgoing,
                new PrivilegePathEdge
                {
                    FromNodeId = relationship.FromAzureResourceId,
                    ToNodeId = relationship.ToAzureResourceId,
                    EdgeType = GraphEdgeTypes.CanReach,
                    ProvenanceKind = ProvenanceKind.DeterministicInference,
                    InferenceSource = SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType,
                });
        }

        Dictionary<string, HashSet<string>> usageIntentTargetsByCompute =
            BuildUsageIntentTargetsByCompute(snapshot.Relationships);

        foreach ((string computeArmId, HashSet<string> intentTargets) in usageIntentTargetsByCompute)
        {
            foreach (string targetArmId in intentTargets)
            {
                if (!dnsJoinIndex.IsMissingDnsJoin(computeArmId, targetArmId)
                    || InventoryPrivateFlowVerdict.Evaluate(dnsJoinIndex, computeArmId, targetArmId,
                        endpointResources) == AzurePrivateConnectivityState.Blocked)
                {
                    continue;
                }

                InventoryPrivilegePathGraph.AddEdge(
                    outgoing,
                    new PrivilegePathEdge
                    {
                        FromNodeId = computeArmId,
                        ToNodeId = targetArmId,
                        EdgeType = GraphEdgeTypes.CanReach,
                        ProvenanceKind = ProvenanceKind.DeterministicInference,
                        InferenceSource = SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType,
                    });
            }
        }
    }

    private static Dictionary<string, HashSet<string>> BuildUsageIntentTargetsByCompute(
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        Dictionary<string, HashSet<string>> targetsByCompute = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            if (!UsageIntentInferenceSources.Contains(relationship.InferenceSource ?? string.Empty))
            {
                continue;
            }

            string sourceArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);
            string targetArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);

            if (!targetsByCompute.TryGetValue(sourceArmId, out HashSet<string>? targets))
            {
                targets = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                targetsByCompute[sourceArmId] = targets;
            }

            targets.Add(targetArmId);
        }

        return targetsByCompute;
    }
}
