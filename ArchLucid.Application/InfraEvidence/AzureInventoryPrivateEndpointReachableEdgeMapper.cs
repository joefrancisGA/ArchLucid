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

        Dictionary<string, string> computeToVnet = BuildComputeToVnetMap(relationships);
        Dictionary<string, string> peToTarget = BuildDirectedMap(
            relationships,
            GraphEdgeInferenceSources.InventoryPrivateEndpoint);
        Dictionary<string, string> peToZone = BuildDirectedMap(
            relationships,
            GraphEdgeInferenceSources.InventoryPeDnsZoneGroup);
        Dictionary<string, HashSet<string>> zoneToVnets = BuildZoneToVnetMap(relationships);
        Dictionary<string, string> peToSubnet = BuildDirectedMap(
            relationships,
            GraphEdgeInferenceSources.InventoryPeSubnet);

        HashSet<string> emittedPairs = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> warnedPairs = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> targetArmIds = peToTarget.Values.ToHashSet(StringComparer.OrdinalIgnoreCase);

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

                    if (!TryHasDnsJoin(peArmId, computeVnetArmId, peToZone, zoneToVnets))
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

                if (!emitted)
                {
                    TryAddDnsMissingWarning(computeArmId, targetArmId, warnedPairs, warnings);
                }
            }
        }
    }

    private static bool TryHasDnsJoin(
        string peArmId,
        string computeVnetArmId,
        IReadOnlyDictionary<string, string> peToZone,
        IReadOnlyDictionary<string, HashSet<string>> zoneToVnets)
    {
        if (!peToZone.TryGetValue(peArmId, out string? zoneArmId))
        {
            return false;
        }

        return zoneToVnets.TryGetValue(zoneArmId, out HashSet<string>? linkedVnets)
            && linkedVnets.Contains(computeVnetArmId);
    }

    private static PathConfidenceBand ResolveBand(
        string peArmId,
        string computeVnetArmId,
        IReadOnlyDictionary<string, string> peToSubnet)
    {
        if (peToSubnet.TryGetValue(peArmId, out string? peSubnetArmId)
            && string.Equals(
                TryResolveVnetIdFromSubnetArmId(peSubnetArmId),
                computeVnetArmId,
                StringComparison.OrdinalIgnoreCase))
        {
            return PathConfidenceBand.HighlyLikely;
        }

        return PathConfidenceBand.Probable;
    }

    private static Dictionary<string, string> BuildComputeToVnetMap(
        IReadOnlyList<AzureInventoryResourceRelationshipWrite> relationships)
    {
        Dictionary<string, string> computeToVnet = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> vmToNic = BuildDirectedMap(relationships, GraphEdgeInferenceSources.InventoryVmNic);
        Dictionary<string, string> nicToSubnet = BuildDirectedMap(relationships, GraphEdgeInferenceSources.InventoryNicSubnet);
        Dictionary<string, string> appToSubnet = BuildDirectedMap(
            relationships,
            GraphEdgeInferenceSources.InventoryAppServiceSubnet);

        foreach ((string appArmId, string subnetArmId) in appToSubnet)
        {
            string? vnetArmId = TryResolveVnetIdFromSubnetArmId(subnetArmId);

            if (string.IsNullOrWhiteSpace(vnetArmId))
            {
                continue;
            }

            computeToVnet[appArmId] = vnetArmId;
        }

        foreach ((string vmArmId, string nicArmId) in vmToNic)
        {
            if (!nicToSubnet.TryGetValue(nicArmId, out string? subnetArmId))
            {
                continue;
            }

            string? vnetArmId = TryResolveVnetIdFromSubnetArmId(subnetArmId);

            if (string.IsNullOrWhiteSpace(vnetArmId))
            {
                continue;
            }

            computeToVnet[vmArmId] = vnetArmId;
        }

        return computeToVnet;
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

    private static Dictionary<string, HashSet<string>> BuildZoneToVnetMap(
        IReadOnlyList<AzureInventoryResourceRelationshipWrite> relationships)
    {
        Dictionary<string, HashSet<string>> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipWrite relationship in relationships)
        {
            if (!string.Equals(
                    relationship.InferenceSource,
                    GraphEdgeInferenceSources.InventoryPrivateDnsVnet,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string zoneArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);
            string vnetArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);

            if (!map.TryGetValue(zoneArmId, out HashSet<string>? vnets))
            {
                vnets = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                map[zoneArmId] = vnets;
            }

            vnets.Add(vnetArmId);
        }

        return map;
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

    private static string? TryResolveVnetIdFromSubnetArmId(string subnetArmId)
    {
        const string marker = "/subnets/";

        int subnetsIndex = subnetArmId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (subnetsIndex <= 0)
        {
            return null;
        }

        return subnetArmId[..subnetsIndex];
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
