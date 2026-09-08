namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Promotes federated-identity and DNS / Front Door properties to stable graph keys (DX-31).
/// </summary>
internal static class InfrastructureDeclarationSpecialPropertyMapper
{
    internal static void Apply(
        Dictionary<string, string> properties,
        string typeDiscriminator,
        string resourceName)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (string.IsNullOrWhiteSpace(typeDiscriminator))
            return;

        MapFederatedIdentityProperties(properties, typeDiscriminator, resourceName);
        MapDnsTopologyProperties(properties, typeDiscriminator, resourceName);
    }

    private static void MapFederatedIdentityProperties(
        Dictionary<string, string> properties,
        string typeDiscriminator,
        string resourceName)
    {
        if (!IsFederatedIdentityType(typeDiscriminator))
            return;

        TryPromoteStableProperty(properties, "issuer", "issuer");
        TryPromoteStableProperty(properties, "subject", "subject");
        TryPromoteStableProperty(properties, "audience", "audience", "audiences");

        if (!properties.ContainsKey("federatedCredentialName")
            && !string.IsNullOrWhiteSpace(resourceName))
        {
            properties["federatedCredentialName"] = resourceName.Trim().ToLowerInvariant();
        }
    }

    private static void MapDnsTopologyProperties(
        Dictionary<string, string> properties,
        string typeDiscriminator,
        string resourceName)
    {
        string normalized = typeDiscriminator.Trim().ToLowerInvariant();

        if (IsFrontDoorType(normalized))
        {
            TryPromoteStableProperty(properties, "hostname", "hostname", "hostName", "frontendhostname");
            TryPromoteStableProperty(properties, "routeHostName", "routehostname", "routeHostName", "customhostname");
        }

        if (normalized.Contains("privatednszones/virtualnetworklinks", StringComparison.Ordinal))
        {
            TryPromoteStableProperty(
                properties,
                "virtualNetworkLink",
                "virtualnetworklink",
                "virtualnetworkid",
                "registrationvirtualnetworks");
        }
        else if (normalized.Contains("privatednszones", StringComparison.Ordinal))
        {
            TryPromoteStableProperty(properties, "privateDnsZone", "privatednszone", "zoneName", "zonename");

            if (!properties.ContainsKey("privateDnsZone") && !string.IsNullOrWhiteSpace(resourceName))
                properties["privateDnsZone"] = resourceName.Trim().ToLowerInvariant();
        }
    }

    private static bool IsFederatedIdentityType(string typeDiscriminator)
    {
        string normalized = typeDiscriminator.Trim().ToLowerInvariant();

        return normalized.Contains("federatedidentitycredentials", StringComparison.Ordinal)
            || normalized.Contains("federated_identity_credential", StringComparison.Ordinal)
            || normalized.Contains("workload_identity_pool_provider", StringComparison.Ordinal);
    }

    private static bool IsFrontDoorType(string normalizedType)
    {
        return normalizedType.Contains("frontdoors", StringComparison.Ordinal)
            || normalizedType.Contains("cdn/profiles", StringComparison.Ordinal)
            || normalizedType.Contains("cdn/endpoints", StringComparison.Ordinal);
    }

    private static void TryPromoteStableProperty(
        Dictionary<string, string> properties,
        string stableKey,
        params string[] tfKeyCandidates)
    {
        if (properties.ContainsKey(stableKey))
            return;

        foreach (string candidate in tfKeyCandidates)
        {
            string sanitized = CanonicalInfrastructurePropertyBag.SanitizePropertyKey(candidate).ToLowerInvariant();
            string tfKey = $"tf.{sanitized}";

            if (!properties.TryGetValue(tfKey, out string? tfValue) || string.IsNullOrWhiteSpace(tfValue))
                continue;

            properties[stableKey] = tfValue;

            return;
        }
    }
}
