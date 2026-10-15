using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Derives compute → store <c>peReachableTarget</c> edges when private DNS proves reachability (SN-PE-04).
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
        List<string> warnings)
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

        Dictionary<string, string> computeToVnet = dnsJoinIndex.ComputeToVnetArmId
            .ToDictionary(static pair => pair.Key, static pair => pair.Value, StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> peToTarget = BuildDirectedMap(
            relationships,
            GraphEdgeInferenceSources.InventoryPrivateEndpoint);
        Dictionary<string, string> peToSubnet = BuildDirectedMap(
            relationships,
            GraphEdgeInferenceSources.InventoryPeSubnet);

        HashSet<string> emittedPairs = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> warnedPairs = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> targetArmIds = peToTarget.Values.ToHashSet(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, List<string>> usageIntentTargetsBySource = BuildUsageIntentTargetsBySource(relationships);

        foreach ((string computeArmId, string computeVnetArmId) in computeToVnet)
        {
            foreach (string targetArmId in targetArmIds)
            {
                string pairKey = $"{computeArmId}|{targetArmId}";
                bool emitted = false;

                foreach ((string peArmId, string peTargetArmId) in peToTarget)
                {
                    if (!string.Equals(peTargetArmId, targetArmId, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (!dnsJoinIndex.TryHasDnsJoin(peArmId, computeVnetArmId))
                    {
                        continue;
                    }

                    if (!emittedPairs.Add(pairKey))
                    {
                        emitted = true;

                        continue;
                    }

                    PathConfidenceBand band = ResolveBand(peArmId, computeVnetArmId, peToSubnet);
                    AddRelationship(
                        relationships,
                        relationshipKeys,
                        computeArmId,
                        targetArmId,
                        definition.DefaultGraphEdgeType,
                        ProvenanceKind.DerivedFact,
                        DerivedFactConfidence,
                        definition.DefaultInferenceSource);
                    emitted = true;
                }

                if (!emitted && HasUsageIntent(computeArmId, targetArmId, usageIntentTargetsBySource))
                {
                    TryAddDnsMissingWarning(computeArmId, targetArmId, warnedPairs, warnings);
                }
            }
        }
    }

    private static PathConfidenceBand ResolveBand(
        string peArmId,
        string computeVnetArmId,
        IReadOnlyDictionary<string, string> peToSubnet)
    {
        if (peToSubnet.TryGetValue(peArmId, out string? peSubnetArmId)
            && string.Equals(
                AzureInventorySubnetArmIdHelper.TryResolveVnetArmIdFromSubnetArmId(peSubnetArmId),
                computeVnetArmId,
                StringComparison.OrdinalIgnoreCase))
        {
            return PathConfidenceBand.HighlyLikely;
        }

        return PathConfidenceBand.Probable;
    }

    private static Dictionary<string, string> BuildDirectedMap(
        IReadOnlyList<AzureInventoryResourceRelationshipWrite> relationships,
        string inferenceSource)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipWrite relationship in relationships)
        {
            if (!string.Equals(relationship.InferenceSource, inferenceSource, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            map[ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId)] =
                ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
        }

        return map;
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
