using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Derives compute → store <c>peReachableTarget</c> edges when private DNS configuration supports a candidate path (SN-PE-04).
/// </summary>
internal static class AzureInventoryPrivateEndpointReachableEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

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

    public static void MapPeReachableTargets(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings,
        IReadOnlyList<AzureExtractorExtendedResourceRow>? resources = null)
    {
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        AzureInventoryPrivateEndpointDnsJoinIndex dnsJoinIndex =
            AzureInventoryPrivateEndpointDnsJoinIndex.Build(
                relationships.Select(static relationship =>
                    new AzureInventoryRelationshipArmTriple(
                        relationship.FromAzureResourceId,
                        relationship.ToAzureResourceId,
                        relationship.InferenceSource)));

        var propertiesByEndpoint = (resources ?? [])
            .GroupBy(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Count() == 1 ? group.Single().Properties : null,
                StringComparer.OrdinalIgnoreCase);

        HashSet<string> warnedPairs = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> targetArmIds = dnsJoinIndex.PrivateEndpointToTargetArmIds.Values
            .SelectMany(targets => targets).ToHashSet(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, List<string>> usageIntentTargetsBySource = BuildUsageIntentTargetsBySource(relationships);

        foreach (string computeArmId in dnsJoinIndex.ComputeToVnetArmIds.Keys)
        {
            foreach (string targetArmId in targetArmIds)
            {
                if (dnsJoinIndex.HasConfigurationDnsJoin(computeArmId, targetArmId))
                {
                    var approvals = dnsJoinIndex.MatchingEndpointIds(computeArmId, targetArmId)
                        .Select(endpoint => AzurePrivateConnectivityEvidence.ResolveApproval(targetArmId,
                            propertiesByEndpoint.GetValueOrDefault(endpoint))).ToArray();
                    if (!approvals.Contains(AzurePrivateConnectivityCheck.Supported))
                    {
                        if (HasUsageIntent(computeArmId, targetArmId, usageIntentTargetsBySource))
                        {
                            string state = approvals.Length > 0 && approvals.All(value => value == AzurePrivateConnectivityCheck.Blocked)
                                ? "blocked" : "unverified";
                            warnings.Add($"private-endpoint-approval-{state}:{computeArmId}:{targetArmId}");
                        }
                        continue;
                    }

                    AddRelationship(
                        relationships,
                        relationshipKeys,
                        computeArmId,
                        targetArmId,
                        definition.DefaultGraphEdgeType,
                        ProvenanceKind.DerivedFact,
                        DerivedFactConfidence,
                        definition.DefaultInferenceSource);
                }
                else if (HasUsageIntent(computeArmId, targetArmId, usageIntentTargetsBySource))
                {
                    TryAddDnsMissingWarning(computeArmId, targetArmId, warnedPairs, warnings);
                }
            }
        }
    }

    private static Dictionary<string, List<string>> BuildUsageIntentTargetsBySource(
        IReadOnlyList<AzureInventoryResourceRelationshipWrite> relationships)
    {
        Dictionary<string, List<string>> targetsBySource = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipWrite relationship in relationships)
        {
            if (!UsageIntentInferenceSources.Contains(relationship.InferenceSource ?? string.Empty))
            {
                continue;
            }

            string sourceArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);

            if (!targetsBySource.TryGetValue(sourceArmId, out List<string>? targets))
            {
                targets = [];
                targetsBySource[sourceArmId] = targets;
            }

            targets.Add(ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId));
        }

        return targetsBySource;
    }

    private static bool HasUsageIntent(
        string computeArmId,
        string targetArmId,
        IReadOnlyDictionary<string, List<string>> usageIntentTargetsBySource)
    {
        if (!usageIntentTargetsBySource.TryGetValue(computeArmId, out List<string>? intentTargets))
        {
            return false;
        }

        return intentTargets.Any(intentTargetArmId =>
            string.Equals(intentTargetArmId, targetArmId, StringComparison.OrdinalIgnoreCase)
            || ArmResourceIdNormalizer.IsDescendantOf(intentTargetArmId, targetArmId)
            || ArmResourceIdNormalizer.IsDescendantOf(targetArmId, intentTargetArmId));
    }

    private static void TryAddDnsMissingWarning(
        string computeArmId,
        string targetArmId,
        HashSet<string> warnedPairs,
        List<string> warnings)
    {
        string key = $"{computeArmId}|{targetArmId}";

        if (!warnedPairs.Add(key))
        {
            return;
        }

        warnings.Add($"{AzureInventoryRelationshipCompletenessWarningCodes.PeReachableDnsLinkMissing}:{computeArmId}:{targetArmId}");
    }

    private static void AddRelationship(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromAzureResourceId,
        string toAzureResourceId,
        string relationshipType,
        ProvenanceKind provenanceKind,
        decimal confidence,
        string inferenceSource)
    {
        string key = $"{fromAzureResourceId}|{relationshipType}|{toAzureResourceId}|{(int)provenanceKind}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromAzureResourceId,
            ToAzureResourceId = toAzureResourceId,
            RelationshipType = relationshipType,
            ProvenanceKind = provenanceKind,
            Confidence = confidence,
            InferenceSource = inferenceSource,
        });
    }
}
