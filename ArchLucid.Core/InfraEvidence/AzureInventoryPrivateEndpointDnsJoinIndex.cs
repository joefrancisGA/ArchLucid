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

    private readonly Dictionary<string, HashSet<string>> _computeToVnetArmIds;
    private readonly Dictionary<string, HashSet<string>> _peToTargetArmIds;
    private readonly Dictionary<string, HashSet<string>> _peToZoneArmIds;
    private readonly Dictionary<string, HashSet<string>> _zoneToVnetArmIds;
    private readonly HashSet<string> _peReachablePairs;

    private AzureInventoryPrivateEndpointDnsJoinIndex(
        Dictionary<string, HashSet<string>> computeToVnetArmIds,
        Dictionary<string, HashSet<string>> peToTargetArmIds,
        Dictionary<string, HashSet<string>> peToZoneArmIds,
        Dictionary<string, HashSet<string>> zoneToVnetArmIds,
        HashSet<string> peReachablePairs)
    {
        _computeToVnetArmIds = computeToVnetArmIds;
        _peToTargetArmIds = peToTargetArmIds;
        _peToZoneArmIds = peToZoneArmIds;
        _zoneToVnetArmIds = zoneToVnetArmIds;
        _peReachablePairs = peReachablePairs;
    }

    public IReadOnlyDictionary<string, HashSet<string>> ComputeToVnetArmIds => _computeToVnetArmIds;

    public IReadOnlyDictionary<string, HashSet<string>> PrivateEndpointToTargetArmIds => _peToTargetArmIds;

    /// <summary>Compatibility projection for unambiguous single-VNet associations only.</summary>
    public IReadOnlyDictionary<string, string> ComputeToVnetArmId => _computeToVnetArmIds
        .Where(pair => pair.Value.Count == 1)
        .ToDictionary(pair => pair.Key, pair => pair.Value.Single(), StringComparer.OrdinalIgnoreCase);

    public bool HasConfigurationDnsJoin(string computeArmId, string targetArmId) =>
        _computeToVnetArmIds.TryGetValue(ArmResourceIdNormalizer.Normalize(computeArmId), out HashSet<string>? vnets)
        && _peToTargetArmIds.Any(pair => pair.Value.Contains(ArmResourceIdNormalizer.Normalize(targetArmId))
            && vnets.Any(vnet => TryHasDnsJoin(pair.Key, vnet)));

    public IEnumerable<string> MatchingEndpointIds(string computeArmId, string targetArmId)
    {
        if (!_computeToVnetArmIds.TryGetValue(ArmResourceIdNormalizer.Normalize(computeArmId), out var vnets))
            yield break;

        foreach (var pair in _peToTargetArmIds)
            if (pair.Value.Contains(ArmResourceIdNormalizer.Normalize(targetArmId))
                && vnets.Any(vnet => TryHasDnsJoin(pair.Key, vnet)))
                yield return pair.Key;
    }

    public bool HasPeReachableTarget(string computeArmId, string targetArmId)
    {
        string pairKey = BuildPairKey(computeArmId, targetArmId);

        return _peReachablePairs.Contains(pairKey) && HasConfigurationDnsJoin(computeArmId, targetArmId);
    }

    public bool HasPrivateEndpointTarget(string targetArmId) =>
        _peToTargetArmIds.Values.SelectMany(targets => targets).Any(peTargetArmId =>
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

        if (!_computeToVnetArmIds.ContainsKey(ArmResourceIdNormalizer.Normalize(computeArmId)))
        {
            return false;
        }

        return HasPrivateEndpointTarget(targetArmId);
    }

    public bool TryHasDnsJoin(string privateEndpointArmId, string computeVnetArmId)
    {
        if (!_peToZoneArmIds.TryGetValue(
                ArmResourceIdNormalizer.Normalize(privateEndpointArmId),
                out HashSet<string>? zoneArmIds))
        {
            return false;
        }

        return zoneArmIds.Any(zoneArmId => _zoneToVnetArmIds.TryGetValue(zoneArmId, out HashSet<string>? linkedVnets)
            && linkedVnets.Contains(ArmResourceIdNormalizer.Normalize(computeVnetArmId)));
    }

    public static AzureInventoryPrivateEndpointDnsJoinIndex Build(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships)
    {
        ArgumentNullException.ThrowIfNull(relationships);

        Dictionary<string, HashSet<string>> vmToNic = BuildMultiMap(relationships, InferenceSources.VmNic);
        Dictionary<string, HashSet<string>> nicToSubnet = BuildMultiMap(relationships, InferenceSources.NicSubnet);
        Dictionary<string, HashSet<string>> appToSubnet = BuildMultiMap(
            relationships,
            InferenceSources.AppServiceSubnet);
        Dictionary<string, HashSet<string>> peToTarget = BuildMultiMap(
            relationships,
            InferenceSources.PrivateEndpoint);
        Dictionary<string, HashSet<string>> peToZone = BuildMultiMap(
            relationships,
            InferenceSources.PeDnsZoneGroup);
        Dictionary<string, HashSet<string>> zoneToVnets = BuildMultiMap(relationships, InferenceSources.PrivateDnsVnet);
        HashSet<string> peReachablePairs = BuildPeReachablePairs(relationships);

        Dictionary<string, HashSet<string>> computeToVnet = BuildComputeToVnetMap(vmToNic, nicToSubnet, appToSubnet);

        return new AzureInventoryPrivateEndpointDnsJoinIndex(
            computeToVnet,
            peToTarget,
            peToZone,
            zoneToVnets,
            peReachablePairs);
    }

    private static Dictionary<string, HashSet<string>> BuildComputeToVnetMap(
        IReadOnlyDictionary<string, HashSet<string>> vmToNic,
        IReadOnlyDictionary<string, HashSet<string>> nicToSubnet,
        IReadOnlyDictionary<string, HashSet<string>> appToSubnet)
    {
        Dictionary<string, HashSet<string>> computeToVnet = new(StringComparer.OrdinalIgnoreCase);

        void AddSubnets(string compute, IEnumerable<string> subnets)
        {
            foreach (string subnet in subnets)
            {
                string? vnet = AzureInventorySubnetArmIdHelper.TryResolveVnetArmIdFromSubnetArmId(subnet);
                if (string.IsNullOrWhiteSpace(vnet))
                    continue;
                if (!computeToVnet.TryGetValue(compute, out HashSet<string>? vnets))
                {
                    vnets = new(StringComparer.OrdinalIgnoreCase);
                    computeToVnet[compute] = vnets;
                }
                vnets.Add(ArmResourceIdNormalizer.Normalize(vnet));
            }
        }

        foreach (var (app, subnets) in appToSubnet)
            AddSubnets(app, subnets);

        foreach (var (vm, nics) in vmToNic)
            foreach (string nic in nics)
                if (nicToSubnet.TryGetValue(nic, out HashSet<string>? subnets))
                    AddSubnets(vm, subnets);

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

    private static Dictionary<string, HashSet<string>> BuildMultiMap(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships,
        string inferenceSource)
    {
        Dictionary<string, HashSet<string>> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryRelationshipArmTriple relationship in relationships)
        {
            if (!string.Equals(
                    relationship.InferenceSource,
                    inferenceSource,
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
