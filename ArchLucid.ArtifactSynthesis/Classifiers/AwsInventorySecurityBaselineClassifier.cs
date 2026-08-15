using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic security-baseline checks for AWS inventory <c>resources.json</c> rows (TB-2262).</summary>
public static class AwsInventorySecurityBaselineClassifier
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

        if (resourceType.Equals("AWS::S3::Bucket", StringComparison.OrdinalIgnoreCase)
            && HasPermissivePublicAccessBlock(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "S3 bucket public access block is not fully enabled.",
                "data-protection");
        }

        if (resourceType.Equals("AWS::EC2::SecurityGroup", StringComparison.OrdinalIgnoreCase)
            && HasOpenAdminIngress(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "Security group allows administrative ingress from 0.0.0.0/0.",
                "network-isolation");
        }

        if (resourceType.Equals("AWS::RDS::DBInstance", StringComparison.OrdinalIgnoreCase)
            && IsStorageEncryptionDisabled(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "RDS instance reports storage encryption disabled.",
                "encryption");
        }

        return null;
    }

    private static bool HasPermissivePublicAccessBlock(JsonElement properties)
    {
        if (!properties.TryGetProperty("publicAccessBlockConfiguration", out JsonElement block))
        {
            return false;
        }

        if (block.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        return IsFalse(block, "blockPublicAcls")
               || IsFalse(block, "ignorePublicAcls")
               || IsFalse(block, "blockPublicPolicy")
               || IsFalse(block, "restrictPublicBuckets");
    }

    private static bool HasOpenAdminIngress(JsonElement properties)
    {
        if (!properties.TryGetProperty("securityGroupIngress", out JsonElement ingressRules))
        {
            return false;
        }

        if (ingressRules.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement rule in ingressRules.EnumerateArray())
        {
            string cidr = ReadString(rule, "cidrIp");

            if (!cidr.Equals("0.0.0.0/0", StringComparison.Ordinal))
            {
                continue;
            }

            if (TryReadPort(rule, "fromPort", out int fromPort)
                && TryReadPort(rule, "toPort", out int toPort)
                && (fromPort <= 22 && toPort >= 22 || fromPort <= 3389 && toPort >= 3389))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsStorageEncryptionDisabled(JsonElement properties)
    {
        if (!properties.TryGetProperty("storageEncrypted", out JsonElement encrypted))
        {
            return false;
        }

        return encrypted.ValueKind is JsonValueKind.False
               || string.Equals(encrypted.GetString(), "false", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsFalse(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out JsonElement value))
        {
            return false;
        }

        if (value.ValueKind is JsonValueKind.False)
        {
            return true;
        }

        if (value.ValueKind is JsonValueKind.True)
        {
            return false;
        }

        return string.Equals(value.GetString(), "false", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryReadPort(JsonElement row, string propertyName, out int port)
    {
        port = 0;

        if (!row.TryGetProperty(propertyName, out JsonElement value))
        {
            return false;
        }

        if (value.ValueKind is JsonValueKind.Number && value.TryGetInt32(out port))
        {
            return true;
        }

        return int.TryParse(value.GetString(), out port);
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
