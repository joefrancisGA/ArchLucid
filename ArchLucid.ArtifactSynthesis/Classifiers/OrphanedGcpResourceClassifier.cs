using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic orphan-resource rules for GCP inventory <c>resources.json</c> rows (TB-2218).</summary>
public static class OrphanedGcpResourceClassifier
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

        if (IsDiskResourceType(resourceType) && HasEmptyUsers(properties))
        {
            return new OrphanedResourceFinding(
                resourceId,
                resourceType,
                "Unattached persistent disk (no users).",
                "CostOptimization");
        }

        if (IsAddressResourceType(resourceType) && HasEmptyUsers(properties))
        {
            return new OrphanedResourceFinding(
                resourceId,
                resourceType,
                "Static IP address with no users.",
                "CostOptimization");
        }

        return null;
    }

    private static bool IsDiskResourceType(string resourceType)
    {
        return resourceType.Equals("compute.googleapis.com/Disk", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("compute#disk", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAddressResourceType(string resourceType)
    {
        return resourceType.Equals("compute.googleapis.com/Address", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("compute#address", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasEmptyUsers(JsonElement properties)
    {
        if (!properties.TryGetProperty("users", out JsonElement users))
        {
            return true;
        }

        if (users.ValueKind is JsonValueKind.Array)
        {
            return users.GetArrayLength() == 0;
        }

        return string.IsNullOrWhiteSpace(users.GetString());
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
