using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic orphan-resource rules for Azure ARM inventory JSON.</summary>
public static class OrphanedResourceClassifier
{
    /// <summary>Cost-optimization finding candidates from extractor <c>resources.json</c> rows.</summary>
    public static IReadOnlyList<OrphanedResourceFinding> ClassifyFromResourcesJson(string resourcesJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourcesJson);

        using JsonDocument document = JsonDocument.Parse(resourcesJson);

        if (document.RootElement.ValueKind is not JsonValueKind.Array)
            return [];

        List<OrphanedResourceFinding> findings = [];

        foreach (JsonElement row in document.RootElement.EnumerateArray())
        {
            OrphanedResourceFinding? finding = TryClassifyRow(row);

            if (finding is not null)
                findings.Add(finding);
        }

        return findings;
    }

    private static OrphanedResourceFinding? TryClassifyRow(JsonElement row)
    {
        if (!row.TryGetProperty("resourceType", out JsonElement typeElement))
            return null;

        string resourceType = typeElement.GetString()?.Trim() ?? string.Empty;
        string resourceId = row.TryGetProperty("resourceId", out JsonElement idElement)
            ? idElement.GetString()?.Trim() ?? string.Empty
            : string.Empty;

        if (string.IsNullOrWhiteSpace(resourceType) || string.IsNullOrWhiteSpace(resourceId))
            return null;

        if (resourceType.Equals("Microsoft.Compute/disks", StringComparison.OrdinalIgnoreCase))
        {
            if (!HasManagedBy(row))
            {
                return new OrphanedResourceFinding(
                    resourceId,
                    resourceType,
                    "Unattached managed disk (no managedBy).",
                    "CostOptimization");
            }
        }

        if (resourceType.Equals("Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            if (!HasVirtualMachineAttachment(row))
            {
                return new OrphanedResourceFinding(
                    resourceId,
                    resourceType,
                    "Network interface with no virtualMachine attachment.",
                    "CostOptimization");
            }
        }

        if (resourceType.Equals("Microsoft.Network/publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            if (!HasIpConfiguration(row))
            {
                return new OrphanedResourceFinding(
                    resourceId,
                    resourceType,
                    "Public IP with no ipConfiguration.",
                    "CostOptimization");
            }
        }

        return null;
    }

    private static bool HasManagedBy(JsonElement row)
    {
        if (!row.TryGetProperty("properties", out JsonElement properties))
            return false;

        if (!properties.TryGetProperty("managedBy", out JsonElement managedBy))
            return false;

        return !string.IsNullOrWhiteSpace(managedBy.GetString());
    }

    private static bool HasVirtualMachineAttachment(JsonElement row)
    {
        if (!row.TryGetProperty("properties", out JsonElement properties))
            return false;

        if (!properties.TryGetProperty("virtualMachine", out JsonElement vm))
            return false;

        if (vm.ValueKind is JsonValueKind.Object && vm.TryGetProperty("id", out JsonElement id))
            return !string.IsNullOrWhiteSpace(id.GetString());

        return !string.IsNullOrWhiteSpace(vm.GetString());
    }

    private static bool HasIpConfiguration(JsonElement row)
    {
        if (!row.TryGetProperty("properties", out JsonElement properties))
            return false;

        if (!properties.TryGetProperty("ipConfiguration", out JsonElement ipConfig))
            return false;

        if (ipConfig.ValueKind is JsonValueKind.Object)
            return ipConfig.TryGetProperty("id", out JsonElement id) && !string.IsNullOrWhiteSpace(id.GetString());

        if (ipConfig.ValueKind is JsonValueKind.Array)
            return ipConfig.GetArrayLength() > 0;

        return false;
    }
}

/// <summary>Orphaned Azure resource candidate surfaced as a cost finding.</summary>
public sealed record OrphanedResourceFinding(
    string ResourceId,
    string ResourceType,
    string Message,
    string Category);
