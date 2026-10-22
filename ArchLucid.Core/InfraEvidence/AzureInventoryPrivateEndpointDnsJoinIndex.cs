namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Snapshot relationship index for private-endpoint DNS joins (SN-PE-04) and missing-link detection (Ch. 7).
/// </summary>
public sealed class AzureInventoryPrivateEndpointDnsJoinIndex
{
    private static class InferenceSources
    {
        public const string AppServiceSubnet = "inventory-appservice-subnet";
        public const string VmNic = "inventory-vm-nic";
        public const string NicSubnet = "inventory-nic-subnet";
        public const string PrivateEndpoint = "inventory-private-endpoint";
        public const string PeDnsZoneGroup = "inventory-pe-dns-zone-group";
        public const string PrivateDnsVnet = "inventory-private-dns-vnet";
        public const string PeReachableTarget = "inventory-pe-reachable-target";
    }

    private readonly Dictionary<string, string> _computeToVnetArmId;
    private readonly Dictionary<string, string> _peToTargetArmId;
    private readonly Dictionary<string, string> _peToZoneArmId;
    private readonly Dictionary<string, HashSet<string>> _zoneToVnetArmIds;
    private readonly HashSet<string> _peReachablePairs;

    private AzureInventoryPrivateEndpointDnsJoinIndex(
        Dictionary<string, string> computeToVnetArmId,
        Dictionary<string, string> peToTargetArmId,
        Dictionary<string, string> peToZoneArmId,
        Dictionary<string, HashSet<string>> zoneToVnetArmIds,
        HashSet<string> peReachablePairs)
    {
        _computeToVnetArmId = computeToVnetArmId;
        _peToTargetArmId = peToTargetArmId;
        _peToZoneArmId = peToZoneArmId;
        _zoneToVnetArmIds = zoneToVnetArmIds;
        _peReachablePairs = peReachablePairs;
    }

    public IReadOnlyDictionary<string, string> ComputeToVnetArmId => _computeToVnetArmId;

    public bool HasPeReachableTarget(string computeArmId, string targetArmId)
    {
        string pairKey = BuildPairKey(computeArmId, targetArmId);

        return _peReachablePairs.Contains(pairKey);
    }

    public bool HasPrivateEndpointTarget(string targetArmId) =>
        _peToTargetArmId.Values.Any(peTargetArmId =>
            string.Equals(peTargetArmId, targetArmId, StringComparison.OrdinalIgnoreCase)
            || ArmResourceIdNormalizer.IsDescendantOf(peTargetArmId, targetArmId)
            || ArmResourceIdNormalizer.IsDescendantOf(targetArmId, peTargetArmId));

    /// <summary>
    ///     VNet-integrated compute with a PE on the store but no DNS-joined <c>peReachableTarget</c> edge.
    /// </summary>
    public bool IsMissingDnsJoin(string computeArmId, string targetArmId)
    {
        if (HasPeReachableTarget(computeArmId, targetArmId))
        {
            return false;
        }

        if (!_computeToVnetArmId.ContainsKey(ArmResourceIdNormalizer.Normalize(computeArmId)))
        {
            return false;
        }

        return HasPrivateEndpointTarget(targetArmId);
    }

    public bool TryHasDnsJoin(string privateEndpointArmId, string computeVnetArmId)
    {
        if (!_peToZoneArmId.TryGetValue(
                ArmResourceIdNormalizer.Normalize(privateEndpointArmId),
                out string? zoneArmId))
        {
            return false;
        }

        return _zoneToVnetArmIds.TryGetValue(zoneArmId, out HashSet<string>? linkedVnets)
            && linkedVnets.Contains(ArmResourceIdNormalizer.Normalize(computeVnetArmId));
    }

    public static AzureInventoryPrivateEndpointDnsJoinIndex Build(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships)
    {
        ArgumentNullException.ThrowIfNull(relationships);

        Dictionary<string, string> vmToNic = BuildDirectedMap(relationships, InferenceSources.VmNic);
        Dictionary<string, string> nicToSubnet = BuildDirectedMap(relationships, InferenceSources.NicSubnet);
        Dictionary<string, string> appToSubnet = BuildDirectedMap(
            relationships,
            InferenceSources.AppServiceSubnet);
        Dictionary<string, string> peToTarget = BuildDirectedMap(
            relationships,
            InferenceSources.PrivateEndpoint);
        Dictionary<string, string> peToZone = BuildDirectedMap(
            relationships,
            InferenceSources.PeDnsZoneGroup);
        Dictionary<string, HashSet<string>> zoneToVnets = BuildZoneToVnetMap(relationships);
        HashSet<string> peReachablePairs = BuildPeReachablePairs(relationships);

        Dictionary<string, string> computeToVnet = BuildComputeToVnetMap(vmToNic, nicToSubnet, appToSubnet);

        return new AzureInventoryPrivateEndpointDnsJoinIndex(
            computeToVnet,
            peToTarget,
            peToZone,
            zoneToVnets,
            peReachablePairs);
    }

    private static Dictionary<string, string> BuildComputeToVnetMap(
        IReadOnlyDictionary<string, string> vmToNic,
        IReadOnlyDictionary<string, string> nicToSubnet,
        IReadOnlyDictionary<string, string> appToSubnet)
    {
        Dictionary<string, string> computeToVnet = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string appArmId, string subnetArmId) in appToSubnet)
        {
            string? vnetArmId = AzureInventorySubnetArmIdHelper.TryResolveVnetArmIdFromSubnetArmId(subnetArmId);

            if (string.IsNullOrWhiteSpace(vnetArmId))
            {
                continue;
            }

            computeToVnet[ArmResourceIdNormalizer.Normalize(appArmId)] =
                ArmResourceIdNormalizer.Normalize(vnetArmId);
        }

        foreach ((string vmArmId, string nicArmId) in vmToNic)
        {
            if (!nicToSubnet.TryGetValue(nicArmId, out string? subnetArmId))
            {
                continue;
            }

            string? vnetArmId = AzureInventorySubnetArmIdHelper.TryResolveVnetArmIdFromSubnetArmId(subnetArmId);

            if (string.IsNullOrWhiteSpace(vnetArmId))
            {
                continue;
            }

            computeToVnet[ArmResourceIdNormalizer.Normalize(vmArmId)] =
                ArmResourceIdNormalizer.Normalize(vnetArmId);
        }

        return computeToVnet;
    }

    private static HashSet<string> BuildPeReachablePairs(IEnumerable<AzureInventoryRelationshipArmTriple> relationships)
    {
        HashSet<string> pairs = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryRelationshipArmTriple relationship in relationships)
        {
            if (!string.Equals(
                    relationship.InferenceSource,
                    InferenceSources.PeReachableTarget,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            pairs.Add(BuildPairKey(relationship.FromAzureResourceId, relationship.ToAzureResourceId));
        }

        return pairs;
    }

    private static Dictionary<string, string> BuildDirectedMap(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships,
        string inferenceSource)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryRelationshipArmTriple relationship in relationships)
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
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships)
    {
        Dictionary<string, HashSet<string>> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryRelationshipArmTriple relationship in relationships)
        {
            if (!string.Equals(
                    relationship.InferenceSource,
                    InferenceSources.PrivateDnsVnet,
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

    private static string BuildPairKey(string fromArmId, string toArmId) =>
        $"{ArmResourceIdNormalizer.Normalize(fromArmId)}|{ArmResourceIdNormalizer.Normalize(toArmId)}";
}

public readonly record struct AzureInventoryRelationshipArmTriple(
    string FromAzureResourceId,
    string ToAzureResourceId,
    string? InferenceSource);
