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
        MapIamAndDataFlowPathProperties(properties, typeDiscriminator);
        MapSegmentationProperties(properties, typeDiscriminator);
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

    private static void MapIamAndDataFlowPathProperties(
        Dictionary<string, string> properties,
        string typeDiscriminator)
    {
        string normalized = typeDiscriminator.Trim().ToLowerInvariant();

        if (IsAwsIamAttachmentType(normalized))
            MapAwsIamAttachmentProperties(properties);
        else if (IsGcpIamMemberType(normalized))
            MapGcpIamMemberProperties(properties);
        else
            MapAzureIamProperties(properties);

        MapDataFlowBackendProperties(properties);
    }

    private static void MapAzureIamProperties(Dictionary<string, string> properties)
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
    }

    private static void MapAwsIamAttachmentProperties(Dictionary<string, string> properties)
    {
        // AWS attachments use `role` for the principal and `policy_arn` for the grant.
        TryPromoteStableProperty(properties, "principalId", "role");
        TryPromoteStableProperty(properties, "roleName", "policy_arn", "policy");
        TryPromoteStableProperty(
            properties,
            "declarationTargetResourceId",
            "scope",
            "bucket",
            "resource");
        StripPolicyArnFromRoleName(properties);
    }

    private static void MapGcpIamMemberProperties(Dictionary<string, string> properties)
    {
        TryPromoteStableProperty(properties, "principalId", "member");
        TryPromoteStableProperty(properties, "roleName", "role");
        TryPromoteStableProperty(
            properties,
            "declarationTargetResourceId",
            "secret_id",
            "bucket",
            "scope",
            "targetResourceId",
            "target_resource_id");
    }

    private static void MapDataFlowBackendProperties(Dictionary<string, string> properties)
    {
        TryPromoteStableProperty(
            properties,
            "declarationBackendNodeId",
            "backend",
            "backend_service",
            "backendAddressPool",
            "backend_address_pool",
            "targetCompute",
            "target_compute",
            "target_group_arn",
            "target_group",
            "default_action");
        TryPromoteStableProperty(
            properties,
            "connectedToNodeIds",
            "connected_to",
            "connectedTo",
            "database",
            "sql_server_id");

        if (ContainsNonEmpty(properties, "connectedToNodeIds"))
            return;

        if (!TryGetIgnoreCase(properties, "declarationBackendNodeId", out string? backend)
            || string.IsNullOrWhiteSpace(backend))
            return;

        properties["connectedToNodeIds"] = backend.Trim();
    }

    private static void MapSegmentationProperties(
        Dictionary<string, string> properties,
        string typeDiscriminator)
    {
        string normalized = typeDiscriminator.Trim().ToLowerInvariant();

        if (IsSegmentationControlType(normalized))
        {
            PromoteOrComposeSecurityRuleBlob(properties);
            TryPromoteStableProperty(
                properties,
                "declarationAssociatedNodeId",
                "subnet_id",
                "network_interface_id");
        }

        if (IsSegmentationAssociationType(normalized))
        {
            TryPromoteStableProperty(
                properties,
                "declarationSegmentationControlId",
                "network_security_group_id",
                "security_group_id",
                "firewall_id");
            TryPromoteStableProperty(properties, "declarationAssociatedNodeId", "subnet_id");
        }
    }

    private static void PromoteOrComposeSecurityRuleBlob(Dictionary<string, string> properties)
    {
        if (ContainsNonEmpty(properties, "declarationSegmentationRule"))
            return;

        if (TryGetIgnoreCase(properties, "tf.security_rule", out string? blob)
            || TryGetIgnoreCase(properties, "tf.ingress", out blob)
            || TryGetIgnoreCase(properties, "security_rule", out blob)
            || TryGetIgnoreCase(properties, "ingress", out blob))
        {
            if (!string.IsNullOrWhiteSpace(blob))
            {
                properties["declarationSegmentationRule"] = blob.Trim();
                return;
            }
        }

        string? composed = ComposeSecurityRuleBlob(properties);

        if (string.IsNullOrWhiteSpace(composed))
            return;

        properties["tf.security_rule"] = composed;
        properties["declarationSegmentationRule"] = composed;
    }

    private static string? ComposeSecurityRuleBlob(Dictionary<string, string> properties)
    {
        string? sourcePrefix = FirstNonEmpty(properties, "tf.source_address_prefix", "source_address_prefix");
        string? cidrBlocks = FirstNonEmpty(properties, "tf.cidr_blocks", "cidr_blocks");
        string? destPort = FirstNonEmpty(properties, "tf.destination_port_range", "destination_port_range");
        string? fromPort = FirstNonEmpty(properties, "tf.from_port", "from_port");
        string? access = FirstNonEmpty(properties, "tf.access", "access");
        string? direction = FirstNonEmpty(properties, "tf.direction", "direction");

        if (string.IsNullOrWhiteSpace(sourcePrefix)
            && string.IsNullOrWhiteSpace(cidrBlocks)
            && string.IsNullOrWhiteSpace(destPort)
            && string.IsNullOrWhiteSpace(fromPort))
        {
            return null;
        }

        List<string> parts = [];

        if (!string.IsNullOrWhiteSpace(access))
            parts.Add($"access = {access.Trim()}");

        if (!string.IsNullOrWhiteSpace(direction))
            parts.Add($"direction = {direction.Trim()}");

        if (!string.IsNullOrWhiteSpace(sourcePrefix))
            parts.Add($"source_address_prefix = {sourcePrefix.Trim()}");

        if (!string.IsNullOrWhiteSpace(cidrBlocks))
            parts.Add($"cidr_blocks = {cidrBlocks.Trim()}");

        if (!string.IsNullOrWhiteSpace(destPort))
            parts.Add($"destination_port_range = {destPort.Trim()}");

        if (!string.IsNullOrWhiteSpace(fromPort))
            parts.Add($"from_port = {fromPort.Trim()}");

        return parts.Count == 0 ? null : string.Join(' ', parts);
    }

    private static string? FirstNonEmpty(Dictionary<string, string> properties, params string[] keys)
    {
        foreach (string key in keys)
        {
            if (TryGetIgnoreCase(properties, key, out string? value) && !string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }

    private static void StripPolicyArnFromRoleName(Dictionary<string, string> properties)
    {
        if (!TryGetIgnoreCase(properties, "roleName", out string? roleName) || string.IsNullOrWhiteSpace(roleName))
            return;

        properties["roleName"] = StripAwsPolicyArnSuffix(roleName);
    }

    private static string StripAwsPolicyArnSuffix(string roleName)
    {
        string trimmed = roleName.Trim();

        if (!trimmed.StartsWith("arn:", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        int slash = trimmed.LastIndexOf('/');

        if (slash < 0 || slash >= trimmed.Length - 1)
            return trimmed;

        return trimmed[(slash + 1)..];
    }

    private static bool IsAwsIamAttachmentType(string normalizedType)
    {
        return normalizedType.Contains("policy_attachment", StringComparison.Ordinal);
    }

    private static bool IsGcpIamMemberType(string normalizedType)
    {
        return normalizedType.Contains("iam_member", StringComparison.Ordinal)
            || normalizedType.Contains("iam_binding", StringComparison.Ordinal);
    }

    private static bool IsSegmentationControlType(string normalizedType)
    {
        if (IsSegmentationAssociationType(normalizedType))
            return false;

        return normalizedType.Contains("network_security_group", StringComparison.Ordinal)
            || normalizedType.Contains("aws_security_group", StringComparison.Ordinal)
            || normalizedType.Contains("google_compute_firewall", StringComparison.Ordinal)
            || normalizedType.Contains("network_security_rule", StringComparison.Ordinal);
    }

    private static bool IsSegmentationAssociationType(string normalizedType)
    {
        if (!normalizedType.Contains("association", StringComparison.Ordinal))
            return false;

        return normalizedType.Contains("security_group", StringComparison.Ordinal)
            || normalizedType.Contains("nsg", StringComparison.Ordinal)
            || normalizedType.Contains("firewall", StringComparison.Ordinal);
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
                if (!string.IsNullOrWhiteSpace(value)
                    && !CanonicalInfrastructurePropertyBag.IsRedactionToken(value))
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
