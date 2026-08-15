using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic orphan-resource rules for AWS inventory <c>resources.json</c> rows (TB-2218).</summary>
public static class OrphanedAwsResourceClassifier
{
    /// <summary>Cost-optimization finding candidates when row <c>properties</c> carry attachment metadata.</summary>
    public static IReadOnlyList<OrphanedResourceFinding> ClassifyFromResourcesJson(string resourcesJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourcesJson);

        using JsonDocument document = JsonDocument.Parse(resourcesJson);

        if (document.RootElement.ValueKind is not JsonValueKind.Array)
        {
            return [];
        }

        List<OrphanedResourceFinding> findings = [];

        foreach (JsonElement row in document.RootElement.EnumerateArray())
        {
            OrphanedResourceFinding? finding = TryClassifyRow(row);

            if (finding is not null)
            {
                findings.Add(finding);
            }
        }

        return findings;
    }

    private static OrphanedResourceFinding? TryClassifyRow(JsonElement row)
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

        if (resourceType.Equals("AWS::EC2::Volume", StringComparison.OrdinalIgnoreCase))
        {
            if (IsUnattachedVolume(properties))
            {
                return new OrphanedResourceFinding(
                    resourceId,
                    resourceType,
                    "Unattached EBS volume (no active attachment).",
                    "CostOptimization");
            }
        }

        if (resourceType.Equals("AWS::EC2::EIP", StringComparison.OrdinalIgnoreCase))
        {
            if (!HasAssociation(properties))
            {
                return new OrphanedResourceFinding(
                    resourceId,
                    resourceType,
                    "Elastic IP with no association.",
                    "CostOptimization");
            }
        }

        if (resourceType.Equals("AWS::EC2::NetworkInterface", StringComparison.OrdinalIgnoreCase))
        {
            if (!HasNetworkInterfaceAttachment(properties))
            {
                return new OrphanedResourceFinding(
                    resourceId,
                    resourceType,
                    "Network interface with no instance attachment.",
                    "CostOptimization");
            }
        }

        return null;
    }

    private static bool IsUnattachedVolume(JsonElement properties)
    {
        string state = ReadString(properties, "state");

        if (!string.IsNullOrWhiteSpace(state)
            && !state.Equals("available", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!properties.TryGetProperty("attachments", out JsonElement attachments))
        {
            return true;
        }

        if (attachments.ValueKind is JsonValueKind.Array)
        {
            return attachments.GetArrayLength() == 0;
        }

        return false;
    }

    private static bool HasAssociation(JsonElement properties)
    {
        if (!properties.TryGetProperty("association", out JsonElement association))
        {
            return false;
        }

        if (association.ValueKind is JsonValueKind.Null)
        {
            return false;
        }

        if (association.ValueKind is JsonValueKind.Object)
        {
            return association.EnumerateObject().Any();
        }

        return !string.IsNullOrWhiteSpace(association.GetString());
    }

    private static bool HasNetworkInterfaceAttachment(JsonElement properties)
    {
        if (!properties.TryGetProperty("attachment", out JsonElement attachment))
        {
            return false;
        }

        if (attachment.ValueKind is JsonValueKind.Null)
        {
            return false;
        }

        if (attachment.ValueKind is JsonValueKind.Object)
        {
            return attachment.TryGetProperty("instanceId", out JsonElement instanceId)
                   && !string.IsNullOrWhiteSpace(instanceId.GetString());
        }

        return false;
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
