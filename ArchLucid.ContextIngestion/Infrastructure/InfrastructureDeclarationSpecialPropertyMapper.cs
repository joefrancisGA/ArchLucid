namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Promotes federated-identity, DNS / Front Door, and IAM / data-flow path properties to stable graph keys
///     (DX-31, DX-69).
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
        MapIamAndDataFlowPathProperties(properties);
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

    private static void MapIamAndDataFlowPathProperties(Dictionary<string, string> properties)
    {
        TryPromoteStableProperty(
            properties,
            "principalId",
            "principalId",
            "principal_id",
            "identity.principalId",
            "identity_principalId",
            "identity_principal_id");
        TryPromoteStableProperty(
            properties,
            "roleName",
            "roleName",
            "role_name",
            "roleDefinitionName",
            "role_definition_name");
        TryPromoteStableProperty(
            properties,
            "declarationTargetResourceId",
            "scope",
            "targetResourceId",
            "target_resource_id");
        TryPromoteStableProperty(
            properties,
            "declarationBackendNodeId",
            "backend",
            "backend_service",
            "backendAddressPool",
            "backend_address_pool",
            "targetCompute",
            "target_compute");

        if (ContainsNonEmpty(properties, "connectedToNodeIds"))
            return;

        if (!TryGetIgnoreCase(properties, "declarationBackendNodeId", out string? backend)
            || string.IsNullOrWhiteSpace(backend))
            return;

        properties["connectedToNodeIds"] = backend.Trim();
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
        if (ContainsNonEmpty(properties, stableKey))
            return;

        foreach (string candidate in tfKeyCandidates)
        {
            string sanitized = CanonicalInfrastructurePropertyBag.SanitizePropertyKey(candidate).ToLowerInvariant();
            string tfKey = $"tf.{sanitized}";

            if (TryGetIgnoreCase(properties, tfKey, out string? value)
                || TryGetIgnoreCase(properties, candidate, out value)
                || TryGetIgnoreCase(properties, sanitized, out value))
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    properties[stableKey] = value.Trim();
                    return;
                }
            }
        }
    }

    private static bool ContainsNonEmpty(Dictionary<string, string> properties, string key)
    {
        return TryGetIgnoreCase(properties, key, out string? value) && !string.IsNullOrWhiteSpace(value);
    }

    private static bool TryGetIgnoreCase(
        Dictionary<string, string> properties,
        string key,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value;
                return true;
            }
        }

        value = null;
        return false;
    }
}
