using System.Text.Json;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Maps Pulumi / CloudFormation resource type strings to canonical object types (DX-42).
/// </summary>
internal static class InfrastructureDeclarationCloudResourceMapper
{
    internal static bool ShouldSkipPulumiResourceType(string resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
            return true;

        string normalized = resourceType.Trim();

        if (normalized.StartsWith("pulumi:pulumi:", StringComparison.OrdinalIgnoreCase))
            return true;

        if (normalized.StartsWith("pulumi:providers:", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    internal static bool TryResolveObjectType(string resourceType, out string objectType)
    {
        objectType = string.Empty;

        if (string.IsNullOrWhiteSpace(resourceType))
            return false;

        string normalized = resourceType.Trim().ToLowerInvariant();

        if (normalized.StartsWith("aws::", StringComparison.Ordinal))
            normalized = normalized.Replace("aws::", "aws:", StringComparison.Ordinal).Replace("::", "/", StringComparison.Ordinal);

        if (IsSecurityBaselineType(normalized))
        {
            objectType = "SecurityBaseline";

            return true;
        }

        if (IsPolicyControlType(normalized))
        {
            objectType = "PolicyControl";

            return true;
        }

        if (IsTopologyResourceType(normalized))
        {
            objectType = "TopologyResource";

            return true;
        }

        return false;
    }

    internal static string ResolveResourceName(string fallbackName, params JsonElement?[] propertySources)
    {
        foreach (JsonElement? source in propertySources)
        {
            if (source is null || source.Value.ValueKind is not JsonValueKind.Object)
                continue;

            if (InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(source.Value, "name", out JsonElement nameElement)
                && InfrastructureDeclarationJsonElementReader.TryReadPlainScalar(nameElement, out string name)
                && !string.IsNullOrWhiteSpace(name))
                return name.Trim().ToLowerInvariant();
        }

        return fallbackName.Trim().ToLowerInvariant();
    }

    internal static string ResolveNameFromPulumiUrn(string? urn, string resourceType)
    {
        if (!string.IsNullOrWhiteSpace(urn))
        {
            string trimmedUrn = urn.Trim();
            int lastColon = trimmedUrn.LastIndexOf(':');

            if (lastColon >= 0 && lastColon < trimmedUrn.Length - 1)
            {
                string segment = trimmedUrn[(lastColon + 1)..].Trim();

                if (!string.IsNullOrWhiteSpace(segment))
                    return segment.ToLowerInvariant();
            }
        }

        if (!string.IsNullOrWhiteSpace(resourceType))
        {
            int lastSegment = resourceType.LastIndexOf(':');

            if (lastSegment >= 0 && lastSegment < resourceType.Length - 1)
                return resourceType[(lastSegment + 1)..].Trim().ToLowerInvariant();
        }

        return "resource";
    }

    private static bool IsSecurityBaselineType(string normalized)
    {
        return normalized.Contains("keyvault", StringComparison.Ordinal)
            || normalized.Contains("key_vault", StringComparison.Ordinal)
            || normalized.Contains("firewall", StringComparison.Ordinal)
            || normalized.Contains("networksecuritygroup", StringComparison.Ordinal)
            || normalized.Contains("network_security_group", StringComparison.Ordinal)
            || normalized.Contains("securitygroup", StringComparison.Ordinal)
            || normalized.Contains("security_group", StringComparison.Ordinal)
            || normalized.Contains("networkacl", StringComparison.Ordinal)
            || normalized.Contains("network_acl", StringComparison.Ordinal);
    }

    private static bool IsPolicyControlType(string normalized)
    {
        return normalized.Contains("policydefinitions", StringComparison.Ordinal)
            || normalized.Contains("policyassignments", StringComparison.Ordinal)
            || normalized.Contains("policydefinition", StringComparison.Ordinal)
            || normalized.Contains("policyassignment", StringComparison.Ordinal);
    }

    private static bool IsTopologyResourceType(string normalized)
    {
        return normalized.Contains("storageaccount", StringComparison.Ordinal)
            || normalized.Contains("storage", StringComparison.Ordinal)
            || normalized.Contains("s3", StringComparison.Ordinal)
            || normalized.Contains("bucket", StringComparison.Ordinal)
            || normalized.Contains("virtualnetwork", StringComparison.Ordinal)
            || normalized.Contains("virtual_network", StringComparison.Ordinal)
            || normalized.Contains("subnet", StringComparison.Ordinal)
            || normalized.Contains("appservice", StringComparison.Ordinal)
            || normalized.Contains("sql", StringComparison.Ordinal)
            || normalized.Contains("database", StringComparison.Ordinal)
            || normalized.Contains("dbinstance", StringComparison.Ordinal)
            || normalized.Contains("rds", StringComparison.Ordinal)
            || normalized.Contains("ec2", StringComparison.Ordinal)
            || normalized.Contains("iam/role", StringComparison.Ordinal)
            || normalized.Contains("iam::role", StringComparison.Ordinal)
            || normalized.Contains("vault", StringComparison.Ordinal)
            || normalized.Contains("loadbalancer", StringComparison.Ordinal)
            || normalized.Contains("function", StringComparison.Ordinal);
    }
}
