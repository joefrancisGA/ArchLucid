using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic security-baseline checks for GCP inventory <c>resources.json</c> rows (TB-2262).</summary>
public static class GcpInventorySecurityBaselineClassifier
{
    public static IReadOnlyList<InventorySecurityBaselineFinding> ClassifyFromResourcesJson(string resourcesJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourcesJson);

        using JsonDocument document = JsonDocument.Parse(resourcesJson);

        if (document.RootElement.ValueKind is not JsonValueKind.Array)
        {
            return [];
        }

        List<InventorySecurityBaselineFinding> findings = [];

        foreach (JsonElement row in document.RootElement.EnumerateArray())
        {
            InventorySecurityBaselineFinding? finding = TryClassifyRow(row);

            if (finding is not null)
            {
                findings.Add(finding);
            }
        }

        return findings;
    }

    private static InventorySecurityBaselineFinding? TryClassifyRow(JsonElement row)
    {
        string resourceType = ReadString(row, "resourceType");
        string resourceId = ReadString(row, "name");

        if (string.IsNullOrWhiteSpace(resourceType) || string.IsNullOrWhiteSpace(resourceId))
        {
            return null;
        }

        if (!row.TryGetProperty("properties", out JsonElement properties))
        {
            return null;
        }

        if (IsStorageBucketResourceType(resourceType)
            && HasPermissivePublicAccessPrevention(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "Cloud Storage bucket does not enforce public access prevention.",
                "data-protection");
        }

        if (IsFirewallResourceType(resourceType)
            && HasOpenAdminIngress(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "Firewall rule allows administrative ingress from 0.0.0.0/0.",
                "network-isolation");
        }

        if (IsCloudSqlResourceType(resourceType)
            && IsRequireSslDisabled(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "Cloud SQL instance reports requireSsl disabled.",
                "encryption");
        }

        return null;
    }

    private static bool IsStorageBucketResourceType(string resourceType)
    {
        return resourceType.Equals("storage.googleapis.com/Bucket", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("storage#bucket", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsFirewallResourceType(string resourceType)
    {
        return resourceType.Equals("compute.googleapis.com/Firewall", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("compute#firewall", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCloudSqlResourceType(string resourceType)
    {
        return resourceType.Contains("sqladmin", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("cloudsql", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasPermissivePublicAccessPrevention(JsonElement properties)
    {
        if (!properties.TryGetProperty("iamConfiguration", out JsonElement iamConfiguration))
        {
            return false;
        }

        string prevention = ReadString(iamConfiguration, "publicAccessPrevention");

        return prevention.Length == 0
               || prevention.Equals("inherited", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasOpenAdminIngress(JsonElement properties)
    {
        if (!properties.TryGetProperty("sourceRanges", out JsonElement sourceRanges))
        {
            return false;
        }

        if (sourceRanges.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        bool allowsInternet = false;

        foreach (JsonElement source in sourceRanges.EnumerateArray())
        {
            if (string.Equals(source.GetString(), "0.0.0.0/0", StringComparison.Ordinal))
            {
                allowsInternet = true;
                break;
            }
        }

        if (!allowsInternet)
        {
            return false;
        }

        if (!properties.TryGetProperty("allowed", out JsonElement allowedRules)
            || allowedRules.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement rule in allowedRules.EnumerateArray())
        {
            string protocol = ReadString(rule, "IPProtocol").ToUpperInvariant();
            string ports = ReadString(rule, "ports");

            if (protocol is "TCP" && (ports.Contains("22", StringComparison.Ordinal) || ports.Contains("3389", StringComparison.Ordinal)))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsRequireSslDisabled(JsonElement properties)
    {
        if (!properties.TryGetProperty("settings", out JsonElement settings))
        {
            return false;
        }

        if (!settings.TryGetProperty("ipConfiguration", out JsonElement ipConfiguration))
        {
            return false;
        }

        if (!ipConfiguration.TryGetProperty("requireSsl", out JsonElement requireSsl))
        {
            return false;
        }

        return requireSsl.ValueKind is JsonValueKind.False
               || string.Equals(requireSsl.GetString(), "false", StringComparison.OrdinalIgnoreCase);
    }

    private static string ReadString(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out JsonElement value))
        {
            return string.Empty;
        }

        return value.GetString()?.Trim() ?? string.Empty;
    }
}
